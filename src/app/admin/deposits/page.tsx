'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, Eye, Calendar, User, CreditCard } from 'lucide-react'

interface Deposit {
  id: number
  user_id: string
  amount: number
  sender_name: string
  sender_last_4_digits: string
  proof_url: string | null
  status: string
  rejection_reason: string | null
  created_at: string
  user_profiles: {
    full_name: string
  }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    fetchDeposits()
  }, [statusFilter, dateFilter])

  const fetchDeposits = async () => {
    let query = supabase
      .from('deposits')
      .select(`
        *,
        user_profiles (
          full_name
        )
      `)

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }
      
      query = query.gte('created_at', startDate.toISOString())
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (data) {
      setDeposits(data)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const approveDeposit = async (depositId: number, amount: number, userId: string) => {
    setProcessingId(depositId)
    
    try {
      // Start a transaction-like operation
      // First, update the deposit status
      const { error: depositError } = await supabase
        .from('deposits')
        .update({ status: 'approved' })
        .eq('id', depositId)

      if (depositError) throw depositError

      // Then, update the user's balance
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: userId,
        amount: amount
      })

      if (balanceError) {
        // If balance update fails, revert deposit status
        await supabase
          .from('deposits')
          .update({ status: 'pending' })
          .eq('id', depositId)
        throw balanceError
      }

      // Process referral commissions (3-level system)
      const { error: commissionError } = await supabase.rpc('process_referral_commissions', {
        deposit_user_id: userId,
        deposit_amount: amount
      })

      if (commissionError) {
        console.error('Error processing referral commissions:', commissionError)
        // Don't revert the deposit approval, just log the error
      }

      // Remove from pending list
      setDeposits(deposits.filter(d => d.id !== depositId))
      
    } catch (error: any) {
      console.error('Error approving deposit:', error)
      alert('Failed to approve deposit: ' + error.message)
    }
    
    setProcessingId(null)
  }

  const rejectDeposit = async (depositId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setProcessingId(depositId)
    
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', depositId)

      if (error) throw error

      // Remove from pending list
      setDeposits(deposits.filter(d => d.id !== depositId))
      setShowRejectModal(null)
      setRejectionReason('')
      
    } catch (error: any) {
      console.error('Error rejecting deposit:', error)
      alert('Failed to reject deposit: ' + error.message)
    }
    
    setProcessingId(null)
  }

  const viewProof = async (proofUrl: string) => {
    if (!proofUrl) return
    
    const { data } = await supabase.storage
      .from('deposit_proofs')
      .createSignedUrl(proofUrl, 3600) // 1 hour expiry

    if (data?.signedUrl) {
      setSelectedProof(data.signedUrl)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusCount = (status: string) => {
    return deposits.filter(d => d.status === status).length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Deposits</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ({deposits.length})</option>
                <option value="pending">Pending ({getStatusCount('pending')})</option>
                <option value="approved">Approved ({getStatusCount('approved')})</option>
                <option value="rejected">Rejected ({getStatusCount('rejected')})</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Deposits</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({deposits.length})</option>
              <option value="pending">Pending ({getStatusCount('pending')})</option>
              <option value="approved">Approved ({getStatusCount('approved')})</option>
              <option value="rejected">Rejected ({getStatusCount('rejected')})</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {deposits.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Deposits</h3>
          <p className="text-gray-700">All deposit requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div key={deposit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <User size={16} className="text-gray-700" />
                      <span className="font-medium text-gray-900">
                        {deposit.user_profiles?.full_name || 'Unknown User'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">User ID: {deposit.user_id.slice(0, 8)}...</p>
                  </div>

                  {/* Amount & Payment Info */}
                  <div>
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {formatCurrency(deposit.amount)}
                    </div>
                    <div className="text-sm text-gray-800">
                      <p>From: {deposit.sender_name}</p>
                      <p>Account: ****{deposit.sender_last_4_digits}</p>
                    </div>
                  </div>

                  {/* Date & Proof */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar size={16} className="text-gray-700" />
                      <span className="text-sm text-gray-800">
                        {formatDate(deposit.created_at)}
                      </span>
                    </div>
                    {deposit.proof_url && (
                      <button
                        onClick={() => viewProof(deposit.proof_url!)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Eye size={16} />
                        <span>View Proof</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-4 lg:mt-0">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deposit.status)}`}>
                      {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                    </span>
                    {deposit.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveDeposit(deposit.id, deposit.amount, deposit.user_id)}
                          disabled={processingId === deposit.id}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setShowRejectModal(deposit.id)}
                          disabled={processingId === deposit.id}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                    {deposit.status === 'rejected' && deposit.rejection_reason && (
                      <span className="text-xs text-red-600" title={deposit.rejection_reason}>
                        Reason: {deposit.rejection_reason.length > 20 ? deposit.rejection_reason.substring(0, 20) + '...' : deposit.rejection_reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-full overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Payment Proof</h3>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedProof}
                alt="Payment Proof"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Reject Deposit</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => rejectDeposit(showRejectModal)}
                  disabled={!rejectionReason.trim() || processingId === showRejectModal}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === showRejectModal ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(null)
                    setRejectionReason('')
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
