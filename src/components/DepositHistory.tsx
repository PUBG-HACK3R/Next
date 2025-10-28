'use client'

import { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle, Eye, Calendar, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Deposit {
  id: number
  deposit_type: 'bank' | 'easypaisa' | 'usdt'
  amount_pkr: number
  amount_usdt?: number
  sender_name?: string
  sender_account_last4?: string
  chain_name?: string
  transaction_hash?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at: string
  processed_at?: string
}

interface DepositHistoryProps {
  userId?: string
  limit?: number
  showTitle?: boolean
}

export default function DepositHistory({ userId, limit = 10, showTitle = true }: DepositHistoryProps) {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchDeposits = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      
      // Get auth token for API request
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/deposits?page=${pageNum}&limit=${limit}`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('DepositHistory API Response:', data)
        console.log('Setting deposits:', data.deposits || [])
        setDeposits(data.deposits || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        const errorData = await response.json()
        console.error('DepositHistory API Error:', errorData)
        setError(errorData.error || 'Failed to fetch deposits')
      }
    } catch (err) {
      console.error('Error fetching deposits:', err)
      setError('Failed to fetch deposits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits(page)
  }, [page, limit])

  // Force refresh when component mounts
  useEffect(() => {
    console.log('DepositHistory component mounted, fetching deposits...')
    fetchDeposits(1)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    }
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

  const formatDepositType = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Bank Transfer'
      case 'easypaisa':
        return 'EasyPaisa'
      case 'usdt':
        return 'USDT Crypto'
      default:
        return type
    }
  }

  if (loading && deposits.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        {showTitle && <h2 className="text-xl font-bold text-white mb-6">Deposit History</h2>}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 bg-white/20 rounded w-32"></div>
                <div className="h-6 bg-white/20 rounded w-20"></div>
              </div>
              <div className="h-3 bg-white/20 rounded w-48 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        {showTitle && <h2 className="text-xl font-bold text-white mb-6">Deposit History</h2>}
        <div className="text-center py-8">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchDeposits(page)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  console.log('DepositHistory render - deposits:', deposits, 'loading:', loading, 'error:', error)

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Deposit History</h2>
          <div className="flex items-center text-white/60 text-sm">
            <DollarSign className="w-4 h-4 mr-1" />
            {deposits.length} deposits
          </div>
        </div>
      )}

      {deposits.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 mb-2">No deposits found</p>
          <p className="text-white/40 text-sm">Your deposit history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div key={deposit.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(deposit.status)}
                  <div>
                    <h3 className="text-white font-medium">
                      {formatDepositType(deposit.deposit_type)}
                    </h3>
                    <p className="text-white/60 text-sm">
                      Deposit #{deposit.id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">
                    PKR {deposit.amount_pkr.toLocaleString()}
                  </div>
                  {deposit.amount_usdt && (
                    <div className="text-white/60 text-sm">
                      {deposit.amount_usdt} USDT
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-white/60 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(deposit.created_at)}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(deposit.status)}`}>
                  {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                </span>
              </div>

              {/* Additional details based on deposit type */}
              <div className="text-white/60 text-sm space-y-1">
                {deposit.deposit_type === 'usdt' ? (
                  <>
                    {deposit.chain_name && (
                      <div>Network: {deposit.chain_name}</div>
                    )}
                    {deposit.transaction_hash && (
                      <div className="font-mono text-xs break-all">
                        Hash: {deposit.transaction_hash.slice(0, 20)}...
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {deposit.sender_name && (
                      <div>Sender: {deposit.sender_name}</div>
                    )}
                    {deposit.sender_account_last4 && (
                      <div>Account: ****{deposit.sender_account_last4}</div>
                    )}
                  </>
                )}
              </div>

              {deposit.status === 'rejected' && deposit.rejection_reason && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    <strong>Rejection Reason:</strong> {deposit.rejection_reason}
                  </p>
                </div>
              )}

              {deposit.processed_at && (
                <div className="mt-2 text-white/40 text-xs">
                  Processed: {formatDate(deposit.processed_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <span className="text-white/60 text-sm">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
