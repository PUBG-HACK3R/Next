'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  HelpCircle,
  Archive,
  ArrowUpRight,
  Eye
} from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'

interface Investment {
  id: number
  plan_id: number
  amount_invested: number
  status: string
  start_date: string
  end_date: string | null
  created_at: string
  last_income_collection_date: string | null
  total_days_collected: number
  daily_profit_amount: number
  plans: {
    name: string
    duration_days: number
    profit_percent: number
    capital_return: boolean
  }
}

interface UserProfile {
  id: string
  full_name: string
  balance: number
  earned_balance: number
}

export default function MyInvestmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [expiredInvestments, setExpiredInvestments] = useState<Investment[]>([])
  const [showExpiredPlans, setShowExpiredPlans] = useState(false)
  const [loading, setLoading] = useState(true)
  const [collectingIncome, setCollectingIncome] = useState<number | null>(null)
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    totalEarnings: 0
  })
  const [earningsStats, setEarningsStats] = useState({
    todayEarnings: 0,
    yesterdayEarnings: 0,
    totalExpiredEarnings: 0
  })
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, balance, earned_balance')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      await fetchInvestments(user.id)
      await fetchExpiredInvestments(user.id)
      await fetchEarningsStats(user.id)
      await fetchProfile(user.id)
      setLoading(false)
    }

    fetchData()
  }, [router])

  const fetchInvestments = async (userId: string) => {
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
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setInvestments(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    }
  }

  const fetchExpiredInvestments = async (userId: string) => {
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
          )
        `)
        .eq('user_id', userId)
        .in('status', ['completed', 'expired'])
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setExpiredInvestments(data)
      }
    } catch (error) {
      console.error('Error fetching expired investments:', error)
    }
  }

  const fetchEarningsStats = async (userId: string) => {
    try {
      // Get daily income collections for earnings stats
      const { data: incomeData, error } = await supabase
        .from('daily_income_collections')
        .select('amount, created_at')
        .eq('user_id', userId)

      let todayEarnings = 0
      let yesterdayEarnings = 0
      let totalExpiredEarnings = 0

      if (!error && incomeData) {
        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        const tomorrow = new Date(today)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

        incomeData.forEach(income => {
          const amount = income.amount
          const incomeDate = new Date(income.created_at)
          
          if (incomeDate >= today && incomeDate < tomorrow) {
            todayEarnings += amount
          } else if (incomeDate >= yesterday && incomeDate < today) {
            yesterdayEarnings += amount
          }
          
          totalExpiredEarnings += amount
        })
      }

      // Also get completed investment profits
      const { data: completedInvestments, error: completedError } = await supabase
        .from('investments')
        .select(`
          amount_invested,
          plans!inner (profit_percent, capital_return)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')

      if (!completedError && completedInvestments) {
        completedInvestments.forEach((investment: any) => {
          const profit = (investment.amount_invested * investment.plans.profit_percent) / 100
          totalExpiredEarnings += profit
        })
      }

      setEarningsStats({
        todayEarnings,
        yesterdayEarnings,
        totalExpiredEarnings
      })
    } catch (error) {
      console.error('Error fetching earnings stats:', error)
    }
  }

  const calculateStats = (investments: Investment[]) => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount_invested, 0)
    const activeInvestments = investments.filter(inv => inv.status === 'active').length
    const completedInvestments = investments.filter(inv => inv.status === 'completed').length
    
    // Calculate total earnings (for completed investments)
    const totalEarnings = investments
      .filter(inv => inv.status === 'completed')
      .reduce((sum, inv) => {
        const profit = (inv.amount_invested * inv.plans.profit_percent) / 100
        return sum + profit
      }, 0)

    setStats({
      totalInvested,
      activeInvestments,
      completedInvestments,
      totalEarnings
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const collectDailyIncome = async (investmentId: number) => {
    if (!user) return
    
    setCollectingIncome(investmentId)
    
    try {
      const { data, error } = await supabase.rpc('collect_daily_income', {
        investment_id_param: investmentId,
        user_id_param: user.id
      })

      if (error) throw error

      if (data.success) {
        // Refresh investments and profile data
        await fetchInvestments(user.id)
        await fetchProfile(user.id)
        
        // Show success message
        alert(`Success! Collected ${formatCurrency(data.profit_earned)} for ${data.days_collected} day(s)${data.is_final_collection ? '. Investment completed!' : ''}`)
      } else {
        alert(data.error || 'Failed to collect income')
      }
    } catch (error: any) {
      console.error('Error collecting income:', error)
      alert('Failed to collect income: ' + error.message)
    }
    
    setCollectingIncome(null)
  }

  const calculateAvailableDays = (investment: Investment) => {
    const now = new Date()
    const startDate = new Date(investment.start_date)
    const remainingDays = investment.plans.duration_days - investment.total_days_collected
    
    let daysSinceReference: number
    
    if (investment.last_income_collection_date) {
      // Subsequent collections: 24 hours from last collection
      const lastCollection = new Date(investment.last_income_collection_date)
      daysSinceReference = Math.floor((now.getTime() - lastCollection.getTime()) / (24 * 60 * 60 * 1000))
    } else {
      // First collection: 24 hours from investment start
      daysSinceReference = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    }
    
    return Math.min(daysSinceReference, remainingDays)
  }

  const canCollectToday = (investment: Investment) => {
    if (investment.status !== 'active') return false
    return calculateAvailableDays(investment) > 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const calculateProgress = (startDate: string, endDate: string | null) => {
    if (!endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()
    
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'completed':
        return 'text-blue-600 bg-blue-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        <h1 className="text-2xl font-bold text-white">My Investments</h1>
        <Link
          href="/dashboard"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Investment</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Invested</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalInvested)}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Active</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.activeInvestments}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.completedInvestments}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Total Earnings</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Locked Earnings</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(profile?.earned_balance || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Available on completion</p>
        </div>
      </div>

      {/* Investments List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Active Investments</h3>
        
        {investments.filter(investment => investment.status === 'active').length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active investments</h3>
            <p className="text-gray-500 mb-4">Start your investment journey by choosing a plan.</p>
            <Link
              href="/dashboard"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Browse Investment Plans
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {investments.filter(investment => investment.status === 'active').map((investment) => {
              const daysRemaining = calculateDaysRemaining(investment.end_date)
              const progress = calculateProgress(investment.start_date, investment.end_date)
              const expectedProfit = (investment.amount_invested * investment.plans.profit_percent) / 100
              const totalReturn = investment.plans.capital_return 
                ? investment.amount_invested + expectedProfit 
                : expectedProfit

              return (
                <div key={investment.id} className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-extrabold text-gray-800">{investment.plans.name}</h4>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(investment.status)}`}>
                      {getStatusIcon(investment.status)}
                      <span className="capitalize">{investment.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Started on {formatDate(investment.start_date)}</p>

                  <div className="grid grid-cols-4 gap-1 mb-3 text-xs">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Investment Amount</span>
                      <p className="text-xs font-bold text-gray-900">{formatCurrency(investment.amount_invested)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Profit Rate</span>
                      <p className="text-xs font-bold text-green-600">{investment.plans.profit_percent}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Duration</span>
                      <p className="text-xs font-bold text-gray-900">{investment.plans.duration_days} days</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Total Profit</span>
                      <p className="text-xs font-bold text-blue-600">{formatCurrency(expectedProfit)}</p>
                    </div>
                  </div>

                  {/* Daily Income Collection - Compact */}
                  {investment.status === 'active' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h5 className="text-xs font-medium text-blue-900">Daily Income Collection</h5>
                          <p className="text-xs text-blue-700">
                            Daily Profit: {formatCurrency(investment.daily_profit_amount || (investment.amount_invested * investment.plans.profit_percent / 100) / investment.plans.duration_days)}
                          </p>
                        </div>
                        <button
                          onClick={() => collectDailyIncome(investment.id)}
                          disabled={!canCollectToday(investment) || collectingIncome === investment.id}
                          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            canCollectToday(investment) && collectingIncome !== investment.id
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>{collectingIncome === investment.id ? 'Collecting...' : 'Collect Profit'}</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div>
                          <span className="text-blue-600">Days Collected:</span>
                          <span className="font-medium ml-1">{investment.total_days_collected || 0} / {investment.plans.duration_days}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Available Days:</span>
                          <span className="font-medium text-green-600 ml-1">{calculateAvailableDays(investment)} days</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Last Collection:</span>
                          <span className="font-medium ml-1">
                            {investment.last_income_collection_date 
                              ? formatDate(investment.last_income_collection_date)
                              : 'Never'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600">Potential Earnings:</span>
                          <span className="font-medium text-green-600 ml-1">
                            {formatCurrency((investment.daily_profit_amount || (investment.amount_invested * investment.plans.profit_percent / 100) / investment.plans.duration_days) * calculateAvailableDays(investment))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {investment.status === 'active' && investment.end_date && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900 font-medium">{daysRemaining} days remaining</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Ends on {formatDate(investment.end_date)}</p>
                    </div>
                  )}


                  {investment.status === 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-900">
                          Investment completed! Earned {formatCurrency(expectedProfit)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>ID: {investment.id}</span>
                      </span>
                      {investment.plans.capital_return && (
                        <span className="text-green-600">✓ Capital Return</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Expired Plans Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Archive className="w-5 h-5 mr-2" />
              Completed Plans
            </h3>
            <button
              onClick={() => setShowExpiredPlans(!showExpiredPlans)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showExpiredPlans ? 'Hide' : 'View'} ({expiredInvestments.length})
              </span>
            </button>
          </div>

          {/* Earnings Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 text-sm">Today Earnings</span>
                <ArrowUpRight className="w-4 h-4 text-green-200" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(earningsStats.todayEarnings)}</div>
              <div className="text-green-200 text-xs mt-1">From commissions</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Yesterday Earnings</span>
                <TrendingUp className="w-4 h-4 text-blue-200" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(earningsStats.yesterdayEarnings)}</div>
              <div className="text-blue-200 text-xs mt-1">Previous day</div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 text-sm">Total Complete Income</span>
                <DollarSign className="w-4 h-4 text-purple-200" />
              </div>
              <div className="text-2xl font-bold">{formatCurrency(earningsStats.totalExpiredEarnings)}</div>
              <div className="text-purple-200 text-xs mt-1">All time</div>
            </div>
          </div>

          {/* Expired Plans List */}
          {showExpiredPlans && (
            <div className="space-y-4">
              {expiredInvestments.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No expired plans found</p>
                </div>
              ) : (
                expiredInvestments.map((investment) => {
                  const profit = (investment.amount_invested * investment.plans.profit_percent) / 100
                  const totalReturn = investment.plans.capital_return ? investment.amount_invested + profit : profit
                  
                  return (
                    <div key={investment.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{investment.plans.name}</h4>
                          <p className="text-sm text-gray-600">Invested: {formatCurrency(investment.amount_invested)}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600 capitalize">{investment.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <div className="font-medium">{investment.plans.duration_days} days</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Profit Rate:</span>
                          <div className="font-medium">{investment.plans.profit_percent}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Profit Earned:</span>
                          <div className="font-medium text-green-600">{formatCurrency(profit)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Return:</span>
                          <div className="font-medium text-green-600">{formatCurrency(totalReturn)}</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                        <span>Started: {formatDate(investment.start_date)}</span>
                        {investment.end_date && <span>Completed: {formatDate(investment.end_date)}</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Customer Support for Investment Help */}
        <div className="mt-8"></div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Investment Support
          </h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              Have questions about your investments, daily income collection, or plan details? Our support team is here to help.
            </p>
            <WhatsAppSupport variant="button" />
          </div>
        </div>
      </div>
    </div>
  )
}
