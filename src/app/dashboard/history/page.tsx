'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Filter,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'investment' | 'commission'
  amount: number
  status: string
  created_at: string
  description: string
  reference?: string
}

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      await fetchTransactions(user.id)
      setLoading(false)
    }

    fetchData()
  }, [router])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, filterType, filterStatus])

  const fetchTransactions = async (userId: string) => {
    try {
      const allTransactions: Transaction[] = []

      // Fetch deposits using the working API
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/deposits?page=1&limit=100', { headers })
      
      if (response.ok) {
        const data = await response.json()
        const deposits = data.deposits || []
        
        deposits.forEach((deposit: any) => {
          allTransactions.push({
            id: `deposit-${deposit.id}`,
            type: 'deposit',
            amount: deposit.amount_pkr,
            status: deposit.status,
            created_at: deposit.created_at,
            description: `${deposit.deposit_type === 'usdt' ? 'USDT' : deposit.deposit_type === 'easypaisa' ? 'EasyPaisa' : 'Bank'} Deposit #${deposit.id}`,
            reference: deposit.id.toString()
          })
        })
      }

      // USDT deposits are now included in the main deposits table above


      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (withdrawals) {
        withdrawals.forEach(withdrawal => {
          allTransactions.push({
            id: `withdrawal-${withdrawal.id}`,
            type: 'withdrawal',
            amount: withdrawal.amount,
            status: withdrawal.status,
            created_at: withdrawal.created_at,
            description: 'Withdrawal Request',
            reference: `WTH-${withdrawal.id}`
          })
        })
      }

      // Fetch investments
      const { data: investments } = await supabase
        .from('investments')
        .select(`
          id, 
          amount_invested, 
          status, 
          created_at,
          plans (name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (investments) {
        investments.forEach((investment: any) => {
          allTransactions.push({
            id: `investment-${investment.id}`,
            type: 'investment',
            amount: investment.amount_invested,
            status: investment.status,
            created_at: investment.created_at,
            description: `Investment in ${investment.plans?.name || 'Plan'}`,
            reference: `INV-${investment.id}`
          })
        })
      }

      // Fetch referral commissions
      const { data: commissions } = await supabase
        .from('referral_commissions')
        .select(`
          id,
          commission_amount,
          level,
          status,
          created_at,
          referred_user_id,
          user_profiles!referred_user_id (full_name)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })

      if (commissions) {
        commissions.forEach((commission: any) => {
          allTransactions.push({
            id: `commission-${commission.id}`,
            type: 'commission',
            amount: commission.commission_amount,
            status: commission.status,
            created_at: commission.created_at,
            description: `Level ${commission.level} referral commission from ${commission.user_profiles?.full_name || 'User'}`,
            reference: `COM-${commission.id}`
          })
        })
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setTransactions(allTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType)
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === filterStatus)
    }

    setFilteredTransactions(filtered)
  }

  const handleRefresh = async () => {
    if (!user) return
    
    setRefreshing(true)
    await fetchTransactions(user.id)
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'rejected':
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'commission':
        return <TrendingUp className="w-4 h-4 text-purple-600" />
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600" />
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'commission':
        return 'text-green-600'
      case 'withdrawal':
      case 'investment':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'commission':
        return '+'
      case 'withdrawal':
      case 'investment':
        return '-'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="investment">Investments</option>
                <option value="commission">Commissions</option>
              </select>
            </div>
            <div className="flex-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-xl font-bold text-gray-900">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-xl font-bold text-yellow-600">
            {filteredTransactions.filter(t => t.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-xl font-bold text-green-600">
            {filteredTransactions.filter(t => ['approved', 'active', 'completed'].includes(t.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-xl font-bold text-red-600">
            {filteredTransactions.filter(t => ['rejected', 'cancelled'].includes(t.status)).length}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div>
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            </h3>
            <p className="text-gray-500">
              {transactions.length === 0 
                ? 'Your transaction history will appear here once you start using the platform.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatDate(transaction.created_at)}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span>{transaction.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                      {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More (placeholder for pagination) */}
      {filteredTransactions.length > 0 && filteredTransactions.length >= 20 && (
        <div className="text-center">
          <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 transition-colors">
            Load More Transactions
          </button>
        </div>
      )}
    </div>
  )
}
