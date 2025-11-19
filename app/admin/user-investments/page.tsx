'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import {
  Search,
  Eye,
  EyeOff,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Gift,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Investment {
  id: number
  user_id: string
  plan_id: number
  amount_invested: number
  status: string
  start_date: string
  end_date: string | null
  last_income_collection_date: string | null
  total_days_collected: number
  created_at: string
  plans: {
    name: string
    duration_days: number
    profit_percent: number
    capital_return: boolean
  }
  user_profiles: {
    full_name: string
    email: string
  }
}

interface UserInvestmentSummary {
  userId: string
  userName: string
  email: string
  totalInvested: number
  activeCount: number
  completedCount: number
  totalEarnings: number
  currentBalance: number
  lockedEarnings: number
}

export default function AdminUserInvestmentsPage() {
  const router = useRouter()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [userSummaries, setUserSummaries] = useState<UserInvestmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [expandedInvestment, setExpandedInvestment] = useState<number | null>(null)
  const [showManualEarnings, setShowManualEarnings] = useState<number | null>(null)
  const [manualEarningsAmount, setManualEarningsAmount] = useState('')
  const [processingInvestment, setProcessingInvestment] = useState<number | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { user } = await getCurrentUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await getUserProfile(user.id)
    if (!profileData || profileData.user_level < 999) {
      router.push('/dashboard')
      return
    }

    await fetchInvestments()
  }

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          plans (
            name,
            duration_days,
            profit_percent,
            capital_return
          ),
          user_profiles (
            full_name,
            email,
            balance,
            earned_balance
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setInvestments(data)
        generateUserSummaries(data)
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    }
    setLoading(false)
  }

  const generateUserSummaries = (investmentData: Investment[]) => {
    const summaryMap = new Map<string, UserInvestmentSummary>()

    investmentData.forEach((inv) => {
      const key = inv.user_id
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          userId: inv.user_id,
          userName: inv.user_profiles.full_name,
          email: inv.user_profiles.email,
          totalInvested: 0,
          activeCount: 0,
          completedCount: 0,
          totalEarnings: 0,
          currentBalance: (inv.user_profiles as any).balance || 0,
          lockedEarnings: (inv.user_profiles as any).earned_balance || 0
        })
      }

      const summary = summaryMap.get(key)!
      summary.totalInvested += inv.amount_invested

      if (inv.status === 'active') {
        summary.activeCount++
      } else if (inv.status === 'completed') {
        summary.completedCount++
        const earnings = (inv.amount_invested * inv.plans.profit_percent) / 100
        summary.totalEarnings += earnings
      }
    })

    setUserSummaries(Array.from(summaryMap.values()))
  }

  const giveManualEarnings = async (investmentId: number, userId: string) => {
    if (!manualEarningsAmount || parseFloat(manualEarningsAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setProcessingInvestment(investmentId)

    try {
      const amount = parseFloat(manualEarningsAmount)

      // Add earnings to user balance
      const { error } = await supabase.rpc('increment_user_balance', {
        user_id: userId,
        amount: amount
      })

      if (error) throw error

      // Record the transaction
      await supabase
        .from('income_transactions')
        .insert({
          user_id: userId,
          investment_id: investmentId,
          amount: amount,
          days_collected: 0,
          is_final_collection: true,
          status: 'completed',
          created_at: new Date().toISOString()
        })

      alert(`Successfully added ${amount} PKR to user balance`)
      setManualEarningsAmount('')
      setShowManualEarnings(null)
      await fetchInvestments()
    } catch (error: any) {
      console.error('Error giving earnings:', error)
      alert('Failed to add earnings: ' + error.message)
    }

    setProcessingInvestment(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDaysRemaining = (endDate: string | null) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredSummaries = userSummaries.filter(summary =>
    summary.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    summary.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const userInvestments = selectedUser
    ? investments.filter(inv => inv.user_id === selectedUser)
    : []

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">User Investments Manager</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">User Investments Manager</h1>
        <button
          onClick={() => {
            setSelectedUser(null)
            fetchInvestments()
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredSummaries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users found</p>
              ) : (
                filteredSummaries.map((summary) => (
                  <button
                    key={summary.userId}
                    onClick={() => setSelectedUser(summary.userId)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedUser === summary.userId
                        ? 'bg-blue-100 border-l-4 border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{summary.userName}</div>
                    <div className="text-xs text-gray-600">{summary.email}</div>
                    <div className="text-xs text-gray-700 mt-1">
                      <span className="font-medium">{summary.activeCount}</span> active,{' '}
                      <span className="font-medium">{summary.completedCount}</span> completed
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Investments Details */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-4">
              {/* User Summary */}
              {userSummaries.find(s => s.userId === selectedUser) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {userSummaries.find(s => s.userId === selectedUser)?.userName}
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userSummaries.find(s => s.userId === selectedUser)?.activeCount}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Active Plans</div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userSummaries.find(s => s.userId === selectedUser)?.completedCount}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Completed Plans</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(userSummaries.find(s => s.userId === selectedUser)?.totalInvested || 0)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Total Invested</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {formatCurrency(userSummaries.find(s => s.userId === selectedUser)?.totalEarnings || 0)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Total Earnings</div>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4 text-center border-2 border-yellow-300">
                      <div className="text-lg font-bold text-yellow-700">
                        {formatCurrency(userSummaries.find(s => s.userId === selectedUser)?.lockedEarnings || 0)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">🔒 Locked Earnings</div>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4 text-center border-2 border-emerald-300">
                      <div className="text-lg font-bold text-emerald-700">
                        {formatCurrency(userSummaries.find(s => s.userId === selectedUser)?.currentBalance || 0)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">💰 Current Balance</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Investments List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Investments</h3>

                {userInvestments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No investments found for this user</p>
                  </div>
                ) : (
                  userInvestments.map((investment) => (
                    <div
                      key={investment.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Investment Header */}
                      <div
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          setExpandedInvestment(
                            expandedInvestment === investment.id ? null : investment.id
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {investment.plans.name}
                              </h4>
                              <span
                                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                  investment.status
                                )}`}
                              >
                                {getStatusIcon(investment.status)}
                                <span className="capitalize">{investment.status}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Started {formatDate(investment.start_date)}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatCurrency(investment.amount_invested)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {investment.plans.profit_percent}% profit
                            </div>
                          </div>

                          <button className="ml-4 text-gray-400 hover:text-gray-600">
                            {expandedInvestment === investment.id ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <div className="text-xs text-gray-600">Duration</div>
                            <div className="font-medium text-gray-900">
                              {investment.plans.duration_days} days
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Days Collected</div>
                            <div className="font-medium text-gray-900">
                              {investment.total_days_collected || 0}/{investment.plans.duration_days}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">
                              {investment.status === 'active' ? 'Days Left' : 'Completed'}
                            </div>
                            <div className="font-medium text-gray-900">
                              {investment.status === 'active'
                                ? calculateDaysRemaining(investment.end_date)
                                : '✓'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedInvestment === investment.id && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                          <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">Start Date</div>
                              <div className="font-medium text-gray-900">
                                {formatDate(investment.start_date)}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm text-gray-600 mb-1">End Date</div>
                              <div className="font-medium text-gray-900">
                                {investment.end_date ? formatDate(investment.end_date) : 'N/A'}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm text-gray-600 mb-1">Last Collection</div>
                              <div className="font-medium text-gray-900">
                                {investment.last_income_collection_date
                                  ? formatDate(investment.last_income_collection_date)
                                  : 'Never'}
                              </div>
                            </div>

                            <div>
                              <div className="text-sm text-gray-600 mb-1">Expected Earnings</div>
                              <div className="font-medium text-green-600">
                                {formatCurrency(
                                  (investment.amount_invested * investment.plans.profit_percent) / 100
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Manual Earnings Section */}
                          {investment.status === 'completed' && (
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                                    <Gift size={16} className="text-yellow-600" />
                                    <span>Give Manual Earnings</span>
                                  </h5>
                                  <p className="text-sm text-gray-600 mt-1">
                                    If user didn't receive earnings on last day, you can manually add them here.
                                  </p>
                                </div>

                                {showManualEarnings === investment.id ? (
                                  <button
                                    onClick={() => setShowManualEarnings(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <EyeOff size={18} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setShowManualEarnings(investment.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Eye size={18} />
                                  </button>
                                )}
                              </div>

                              {showManualEarnings === investment.id && (
                                <div className="mt-4 space-y-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                      Amount (PKR)
                                    </label>
                                    <input
                                      type="number"
                                      value={manualEarningsAmount}
                                      onChange={(e) => setManualEarningsAmount(e.target.value)}
                                      placeholder="Enter amount"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() =>
                                        giveManualEarnings(investment.id, investment.user_id)
                                      }
                                      disabled={processingInvestment === investment.id}
                                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                                    >
                                      {processingInvestment === investment.id
                                        ? 'Processing...'
                                        : 'Give Earnings'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowManualEarnings(null)
                                        setManualEarningsAmount('')
                                      }}
                                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
              <p className="text-gray-600">
                Choose a user from the list to view and manage their investments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
