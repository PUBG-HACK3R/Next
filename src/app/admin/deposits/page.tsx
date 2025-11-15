'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, Eye, Calendar, User, CreditCard } from 'lucide-react'

interface Deposit {
  id: number
  user_id: string
  deposit_type: string
  amount_pkr: number
  sender_name: string
  sender_account_last4: string
  amount_usdt?: number
  chain_name?: string
  transaction_hash?: string
  proof_url: string | null
  status: string
  rejection_reason: string | null
  created_at: string
  processed_by?: string
  processed_at?: string
  processed_by_name?: string
  admin_notes?: string
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchDeposits()
  }, [statusFilter])

  const fetchDeposits = async () => {
    try {
      setLoading(true)
      // Use the working admin API
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      let url = '/api/admin/deposits?page=1&limit=100'
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }

      const response = await fetch(url, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setDeposits(data.deposits || [])
      } else {
        console.error('Failed to fetch admin deposits')
      }
    } catch (error) {
      console.error('Error fetching admin deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveDeposit = async (depositId: number, amount: number, userId: string) => {
    setProcessingId(depositId)
    try {
      console.log('Approving deposit:', depositId)
      const response = await fetch('/api/admin/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_id: depositId,
          action: 'approve'
        })
      })

      console.log('Approve response status:', response.status)
      const responseData = await response.json()
      console.log('Approve response data:', responseData)

      if (response.ok) {
        setDeposits(deposits.map(d => 
          d.id === depositId ? { ...d, status: 'approved' } : d
        ))
        alert('Deposit approved successfully!')
      } else {
        const errorMsg = responseData.details ? `${responseData.error}: ${responseData.details}` : (responseData.error || 'Unknown error')
        alert('Failed to approve deposit: ' + errorMsg)
      }
    } catch (error) {
      console.error('Error approving deposit:', error)
      alert('Error approving deposit: ' + error)
    } finally {
      setProcessingId(null)
    }
  }

  const rejectDeposit = async (depositId: number) => {
    setProcessingId(depositId)
    try {
      console.log('Rejecting deposit:', depositId, 'with reason:', rejectionReason)
      const response = await fetch('/api/admin/deposits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deposit_id: depositId,
          action: 'reject',
          rejection_reason: rejectionReason
        })
      })

      console.log('Reject response status:', response.status)
      const responseData = await response.json()
      console.log('Reject response data:', responseData)

      if (response.ok) {
        setDeposits(deposits.map(d => 
          d.id === depositId ? { ...d, status: 'rejected', rejection_reason: rejectionReason } : d
        ))
        setShowRejectModal(null)
        setRejectionReason('')
        alert('Deposit rejected successfully!')
      } else {
        alert('Failed to reject deposit: ' + (responseData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error)
      alert('Error rejecting deposit: ' + error)
    } finally {
      setProcessingId(null)
    }
  }

  const viewProof = async (url: string) => {
    if (!url) return
    
    try {
      // If it's already a full URL (http/https), use it directly
      if (url.startsWith('http')) {
        setSelectedProof(url)
        return
      }
      
      // Otherwise, get signed URL from Supabase Storage
      const { data } = await supabase.storage
        .from('deposit_proofs')
        .createSignedUrl(url, 3600) // 1 hour expiry

      if (data?.signedUrl) {
        setSelectedProof(data.signedUrl)
      } else {
        console.error('Failed to get signed URL for proof')
        alert('Failed to load proof image')
      }
    } catch (error) {
      console.error('Error loading proof:', error)
      alert('Failed to load proof image')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deposit Management</h1>
        
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <button
            onClick={fetchDeposits}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {deposits.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No deposits found</p>
          <p className="text-gray-400 text-sm">Deposit requests will appear here for review</p>
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
                        User ID: {deposit.user_id.slice(0, 8)}...
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">Deposit #{deposit.id}</p>
                  </div>

                  {/* Amount & Payment Info */}
                  <div>
                    <div className="text-lg font-bold text-green-600 mb-1">
                      {formatCurrency(deposit.amount_pkr)}
                    </div>
                    <div className="text-sm text-gray-800">
                      <p>Type: {deposit.deposit_type.toUpperCase()}</p>
                      {deposit.sender_name && <p>From: {deposit.sender_name}</p>}
                      {deposit.sender_account_last4 && <p>Account: ****{deposit.sender_account_last4}</p>}
                      {deposit.amount_usdt && <p>USDT: {deposit.amount_usdt}</p>}
                      {deposit.chain_name && <p>Chain: {deposit.chain_name}</p>}
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
                          onClick={() => approveDeposit(deposit.id, deposit.amount_pkr, deposit.user_id)}
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
                  </div>
                </div>
              </div>

              {deposit.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {deposit.rejection_reason}
                  </p>
                </div>
              )}

              {/* Admin Approval Info */}
              {(deposit.status === 'approved' || deposit.status === 'rejected') && deposit.processed_by && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>{deposit.status === 'approved' ? 'Approved' : 'Rejected'} by:</strong> {deposit.processed_by_name || `Admin (${deposit.processed_by.slice(0, 8)}...)`}
                    {deposit.processed_at && (
                      <span className="ml-2 text-blue-600">
                        on {formatDate(deposit.processed_at)}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Deposit</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectDeposit(showRejectModal)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Deposit Proof</h3>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <img
              src={selectedProof}
              alt="Deposit Proof"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
