'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, Eye, Calendar, User, Coins, Filter, ChevronDown } from 'lucide-react'

interface UsdtDeposit {
  id: number
  user_id: string
  amount_usdt: number
  amount_pkr: number
  usdt_rate: number
  wallet_address: string
  chain_name: string
  transaction_hash: string
  proof_url: string | null
  status: string
  rejection_reason: string | null
  created_at: string
  user_profiles: {
    full_name: string
  }
}

export default function AdminUsdtDepositsPage() {
  console.log('AdminUsdtDepositsPage component initialized')
  
  const [deposits, setDeposits] = useState<UsdtDeposit[]>([])
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
    console.log('=== ADMIN USDT DEPOSITS FETCH START ===')
    console.log('Status filter:', statusFilter)
    console.log('Date filter:', dateFilter)
    
    let query = supabase
      .from('usdt_deposits')
      .select(`
        *,
        user_profiles (
          full_name
        )
      `)
    
    console.log('Initial query created')

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

    if (error) {
      console.error('Admin USDT Deposits Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      })
    }

    if (data) {
      console.log('Admin USDT Deposits Data:', data)
      console.log('Number of deposits found:', data.length)
      setDeposits(data)
    } else {
      console.log('No USDT deposits data received')
    }
    
    console.log('Setting loading to false')
    setLoading(false)
    console.log('=== ADMIN USDT DEPOSITS FETCH END ===')
  }

  const formatCurrency = (amount: number, currency: string = 'PKR') => {
    if (currency === 'USDT') {
      return `${amount.toFixed(2)} USDT`
    }
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
      // Update the deposit status
      const { error: depositError } = await supabase
        .from('usdt_deposits')
        .update({ status: 'approved' })
        .eq('id', depositId)

      if (depositError) throw depositError

      // Update user balance
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: userId,
        amount: amount
      })

      if (balanceError) throw balanceError

      // Refresh deposits
      fetchDeposits()
      alert('USDT deposit approved successfully!')
      
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
        .from('usdt_deposits')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason
        })
        .eq('id', depositId)

      if (error) throw error

      fetchDeposits()
      setShowRejectModal(null)
      setRejectionReason('')
      alert('USDT deposit rejected successfully!')
      
    } catch (error: any) {
      console.error('Error rejecting deposit:', error)
      alert('Failed to reject deposit: ' + error.message)
    }
    
    setProcessingId(null)
  }

  const viewProof = async (proofUrl: string) => {
    // Check if this is a temporary proof URL
    if (proofUrl.startsWith('temp_proof_')) {
      alert('This is a temporary proof URL. The actual file was not uploaded due to storage configuration issues. Please ask the user to re-submit with proper file upload.')
      return
    }

    const { data, error } = await supabase.storage
      .from('deposit_proofs')
      .createSignedUrl(proofUrl, 3600) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      alert('Failed to load proof image: ' + error.message)
      return
    }

    if (data?.signedUrl) {
      setSelectedProof(data.signedUrl)
    } else {
      alert('Failed to generate proof URL')
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage USDT Deposits</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Manage USDT Deposits</h1>
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
          <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No USDT Deposits Found' : `No ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} USDT Deposits`}
          </h3>
          <p className="text-gray-700">
            {statusFilter === 'all' ? 'No USDT deposit requests found for the selected period.' : `No ${statusFilter} USDT deposit requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div key={deposit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-4 h-4 text-gray-700" />
                      <span className="font-medium text-gray-900">
                        {deposit.user_profiles.full_name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {formatDate(deposit.created_at)}
                    </p>
                  </div>

                  {/* Amount Info */}
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(deposit.amount_usdt, 'USDT')}
                    </div>
                    <div className="text-sm text-gray-700">
                      ≈ {formatCurrency(deposit.amount_pkr)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rate: 1 USDT = PKR {deposit.usdt_rate}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div>
                    <div className="text-sm text-gray-700">
                      <strong>Chain:</strong> {deposit.chain_name}
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>Hash:</strong> 
                      <span className="font-mono text-xs ml-1 break-all">
                        {deposit.transaction_hash}
                      </span>
                    </div>
                    {deposit.proof_url && (
                      <button
                        onClick={() => viewProof(deposit.proof_url!)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
                      >
                        <Eye size={16} />
                        <span>View Proof</span>
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
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
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Transaction Proof</h3>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <img 
                src={selectedProof} 
                alt="Transaction Proof" 
                className="max-w-full h-auto"
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
              <h3 className="text-lg font-semibold mb-4">Reject USDT Deposit</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for rejection..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => rejectDeposit(showRejectModal)}
                  disabled={!rejectionReason.trim() || processingId === showRejectModal}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === showRejectModal ? 'Rejecting...' : 'Reject Deposit'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(null)
                    setRejectionReason('')
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
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
