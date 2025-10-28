'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  HelpCircle
} from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'

interface UserProfile {
  id: string
  full_name: string
  balance: number
}

interface Transaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'investment' | 'commission' | 'income'
  amount: number
  status: string
  created_at: string
  description?: string
}

interface WalletStats {
  activeInvestments: number
  totalEarned: number
  totalWithdrawn: number
}

export default function WalletPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<WalletStats>({
    activeInvestments: 0,
    totalEarned: 0,
    totalWithdrawn: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileData } = await getUserProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      }

      await Promise.all([
        fetchTransactions(user.id),
        fetchStats(user.id)
      ])

      setLoading(false)
    }

    fetchData()
  }, [router])

  const fetchTransactions = async (userId: string) => {
    try {
      // Fetch recent deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('id, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch recent withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch recent investments
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
        .limit(10)

      // Combine and format transactions
      const allTransactions: Transaction[] = []

      if (deposits) {
        deposits.forEach(deposit => {
          allTransactions.push({
            id: deposit.id,
            type: 'deposit',
            amount: deposit.amount,
            status: deposit.status,
            created_at: deposit.created_at,
            description: 'Deposit'
          })
        })
      }

      if (withdrawals) {
        withdrawals.forEach(withdrawal => {
          allTransactions.push({
            id: withdrawal.id,
            type: 'withdrawal',
            amount: withdrawal.amount,
            status: withdrawal.status,
            created_at: withdrawal.created_at,
            description: 'Withdrawal'
          })
        })
      }

      if (investments) {
        investments.forEach((investment: any) => {
          allTransactions.push({
            id: investment.id,
            type: 'investment',
            amount: investment.amount_invested,
            status: investment.status,
            created_at: investment.created_at,
            description: `Investment in ${investment.plans?.name || 'Plan'}`
          })
        })
      }

      // Fetch recent commissions
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
        .limit(10)

      // Fetch recent income transactions
      const { data: incomeTransactions } = await supabase
        .from('income_transactions')
        .select(`
          id,
          amount,
          days_collected,
          is_final_collection,
          status,
          created_at,
          investment_id,
          investments!investment_id (
            plans (name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (commissions) {
        commissions.forEach((commission: any) => {
          allTransactions.push({
            id: commission.id,
            type: 'commission',
            amount: commission.commission_amount,
            status: commission.status,
            created_at: commission.created_at,
            description: `Level ${commission.level} referral commission from ${commission.user_profiles?.full_name || 'User'}`
          })
        })
      }

      if (incomeTransactions) {
        incomeTransactions.forEach((income: any) => {
          allTransactions.push({
            id: income.id,
            type: 'income',
            amount: income.amount,
            status: income.status,
            created_at: income.created_at,
            description: `Daily income from ${income.investments?.plans?.name || 'Investment'} (${income.days_collected} day${income.days_collected > 1 ? 's' : ''})${income.is_final_collection ? ' - Final Collection' : ''}`
          })
        })
      }

      // Sort by date
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setTransactions(allTransactions.slice(0, 10))

    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchStats = async (userId: string) => {
    try {
      // Get active investments count
      const { count: activeInvestmentsCount } = await supabase
        .from('investments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

      // Get total approved withdrawals
      const { data: approvedWithdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'approved')

      const totalWithdrawn = approvedWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0

      // For now, set totalEarned to 0 (will be calculated based on completed investments in future)
      const totalEarned = 0

      setStats({
        activeInvestments: activeInvestmentsCount || 0,
        totalEarned,
        totalWithdrawn
      })

    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
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
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (type === 'deposit') {
      return <ArrowDownLeft className="w-4 h-4 text-green-600" />
    } else if (type === 'withdrawal') {
      return <ArrowUpRight className="w-4 h-4 text-red-600" />
    } else if (type === 'income') {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    } else {
      return <TrendingUp className="w-4 h-4 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
      <h1 className="text-2xl font-bold text-white">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">My Wallet Balance</h2>
        <p className="text-3xl font-bold mb-4">
          {profile ? formatCurrency(profile.balance) : 'PKR 0.00'}
        </p>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/deposit"
            className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors text-black !important"
          >
            <span className="text-black !important">Deposit</span>
            <Plus size={16} className="text-black !important" />
          </Link>
          <Link
            href="/dashboard/withdraw"
            className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors text-black !important"
          >
            <span className="text-black !important">Withdraw</span>
            <Minus size={16} className="text-black !important" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Active Investments</p>
          <p className="text-lg font-bold text-gray-900">{stats.activeInvestments}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-sm text-gray-600">Total Earned</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalEarned)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mx-auto mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-sm text-gray-600">Total Withdrawn</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalWithdrawn)}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <Link
            href="/dashboard/history"
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-500 mb-4">Start by making your first deposit or investment.</p>
            <Link
              href="/dashboard/deposit"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Make First Deposit
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={`${transaction.type}-${transaction.id}`} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'deposit' || transaction.type === 'income' || transaction.type === 'commission' ? 'text-green-600' : 
                      transaction.type === 'withdrawal' ? 'text-red-600' : 
                      transaction.type === 'investment' ? 'text-gray-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'withdrawal' ? '-' : transaction.type === 'investment' ? '' : '+'}
                      {formatCurrency(transaction.amount)}
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

      {/* Customer Support - Help with transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Need Help?
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Having issues with deposits, withdrawals, or transactions? Contact our support team for assistance.
          </p>
          <WhatsAppSupport variant="button" />
        </div>
      </div>
    </div>
  )
}
