'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, User, Calendar, Banknote, AlertTriangle } from 'lucide-react'

interface Withdrawal {
  id: number
  user_id: string
  amount: number
  status: string
  rejection_reason: string | null
  created_at: string
  user_profiles: {
    full_name: string
    withdrawal_account_type: string | null
    withdrawal_account_name: string | null
    withdrawal_account_number: string | null
  }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter, dateFilter])

  const fetchWithdrawals = async () => {
    let query = supabase
      .from('withdrawals')
      .select(`
        *,
        user_profiles (
          full_name,
          withdrawal_account_type,
          withdrawal_account_name,
          withdrawal_account_number
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
      setWithdrawals(data)
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

  const approveWithdrawal = async (withdrawalId: number) => {
    setProcessingId(withdrawalId)
    
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'approved' })
        .eq('id', withdrawalId)

      if (error) throw error

      // Remove from pending list
      setWithdrawals(withdrawals.filter(w => w.id !== withdrawalId))
      
    } catch (error: any) {
      console.error('Error approving withdrawal:', error)
      alert('Failed to approve withdrawal: ' + error.message)
    }
    
    setProcessingId(null)
  }

  const rejectWithdrawal = async (withdrawalId: number, userId: string, amount: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setProcessingId(withdrawalId)
    
    try {
      // Start transaction-like operation
      // First, update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', withdrawalId)

      if (withdrawalError) throw withdrawalError

      // Then, add the amount back to user's balance
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: userId,
        amount: amount
      })

      if (balanceError) {
        // If balance update fails, revert withdrawal status
        await supabase
          .from('withdrawals')
          .update({ status: 'pending', rejection_reason: null })
          .eq('id', withdrawalId)
        throw balanceError
      }

      // Remove from pending list
      setWithdrawals(withdrawals.filter(w => w.id !== withdrawalId))
      setShowRejectModal(null)
      setRejectionReason('')
      
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error)
      alert('Failed to reject withdrawal: ' + error.message)
    }
    
    setProcessingId(null)
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
    return withdrawals.filter(w => w.status === status).length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Withdrawals</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ({withdrawals.length})</option>
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Withdrawals</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({withdrawals.length})</option>
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

      {withdrawals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Banknote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No Withdrawals Found' : `No ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Withdrawals`}
          </h3>
          <p className="text-gray-700">
            {statusFilter === 'all' ? 'No withdrawal requests found for the selected period.' : `No ${statusFilter} withdrawal requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <User size={16} className="text-gray-700" />
                      <span className="font-medium text-gray-900">
                        {withdrawal.user_profiles?.full_name || 'Unknown User'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">User ID: {withdrawal.user_id.slice(0, 8)}...</p>
                  </div>

                  {/* Amount & Date */}
                  <div>
                    <div className="text-lg font-bold text-red-600 mb-1">
                      {formatCurrency(withdrawal.amount)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-800">
                      <Calendar size={16} className="text-gray-700" />
                      <span>{formatDate(withdrawal.created_at)}</span>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div>
                    {withdrawal.user_profiles?.withdrawal_account_type ? (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {withdrawal.user_profiles.withdrawal_account_type}
                        </p>
                        <p className="text-gray-800">
                          {withdrawal.user_profiles.withdrawal_account_name}
                        </p>
                        <p className="text-gray-800">
                          {withdrawal.user_profiles.withdrawal_account_number}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-red-600">
                        <AlertTriangle size={16} />
                        <span>No account bound</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </span>
                  
                  {withdrawal.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveWithdrawal(withdrawal.id)}
                        disabled={processingId === withdrawal.id || !withdrawal.user_profiles?.withdrawal_account_type}
                        className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check size={14} />
                        <span>{processingId === withdrawal.id ? 'Processing...' : 'Approve'}</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal(withdrawal.id)}
                        disabled={processingId === withdrawal.id}
                        className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                  
                  {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                    <span className="text-xs text-red-600" title={withdrawal.rejection_reason}>
                      Reason: {withdrawal.rejection_reason.length > 20 ? withdrawal.rejection_reason.substring(0, 20) + '...' : withdrawal.rejection_reason}
                    </span>
                  )}
                </div>
              </div>

              {/* Warning for missing account */}
              {!withdrawal.user_profiles?.withdrawal_account_type && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      User has not bound a withdrawal account. Cannot process this withdrawal.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Reject Withdrawal</h3>
              <p className="text-sm text-gray-800 mb-4">
                The withdrawal amount will be returned to the user's balance.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    const withdrawal = withdrawals.find(w => w.id === showRejectModal)
                    if (withdrawal) {
                      rejectWithdrawal(showRejectModal, withdrawal.user_id, withdrawal.amount)
                    }
                  }}
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
