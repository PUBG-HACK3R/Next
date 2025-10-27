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
  HelpCircle
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

export default function MyInvestmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [collectingIncome, setCollectingIncome] = useState<number | null>(null)
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    totalEarnings: 0
  })
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      await fetchInvestments(user.id)
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
        // Refresh investments data
        await fetchInvestments(user.id)
        
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
    const lastCollection = investment.last_income_collection_date 
      ? new Date(investment.last_income_collection_date) 
      : new Date(startDate.getTime() - 24 * 60 * 60 * 1000) // Day before start if never collected
    
    const daysSinceLastCollection = Math.floor((now.getTime() - lastCollection.getTime()) / (24 * 60 * 60 * 1000))
    const remainingDays = investment.plans.duration_days - investment.total_days_collected
    
    return Math.min(daysSinceLastCollection, remainingDays)
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Investments List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Investment History</h3>
        
        {investments.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No investments yet</h3>
            <p className="text-gray-500 mb-4">Start your investment journey by choosing a plan.</p>
            <Link
              href="/dashboard"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Browse Investment Plans
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((investment) => {
              const daysRemaining = calculateDaysRemaining(investment.end_date)
              const progress = calculateProgress(investment.start_date, investment.end_date)
              const expectedProfit = (investment.amount_invested * investment.plans.profit_percent) / 100
              const totalReturn = investment.plans.capital_return 
                ? investment.amount_invested + expectedProfit 
                : expectedProfit

              return (
                <div key={investment.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{investment.plans.name}</h4>
                      <p className="text-sm text-gray-600">
                        Started on {formatDate(investment.start_date)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(investment.status)}`}>
                      {getStatusIcon(investment.status)}
                      <span className="capitalize">{investment.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Investment Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(investment.amount_invested)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit Rate</p>
                      <p className="font-semibold text-green-600">{investment.plans.profit_percent}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{investment.plans.duration_days} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expected Return</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(totalReturn)}</p>
                    </div>
                  </div>

                  {investment.status === 'active' && investment.end_date && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-900 font-medium">
                          {daysRemaining} days remaining
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Ends on {formatDate(investment.end_date)}
                      </p>
                    </div>
                  )}

                  {/* Daily Income Collection Section */}
                  {investment.status === 'active' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-blue-900">Daily Income Collection</h5>
                          <p className="text-sm text-blue-700">
                            Daily Profit: {formatCurrency(investment.daily_profit_amount || (investment.amount_invested * investment.plans.profit_percent / 100) / investment.plans.duration_days)}
                          </p>
                        </div>
                        <button
                          onClick={() => collectDailyIncome(investment.id)}
                          disabled={!canCollectToday(investment) || collectingIncome === investment.id}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            canCollectToday(investment) && collectingIncome !== investment.id
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {collectingIncome === investment.id ? 'Collecting...' : 'Receive Income'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-600">Days Collected:</p>
                          <p className="font-medium">{investment.total_days_collected || 0} / {investment.plans.duration_days}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Available Days:</p>
                          <p className="font-medium text-green-600">{calculateAvailableDays(investment)} days</p>
                        </div>
                        <div>
                          <p className="text-blue-600">Last Collection:</p>
                          <p className="font-medium">
                            {investment.last_income_collection_date 
                              ? formatDate(investment.last_income_collection_date)
                              : 'Never'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">Potential Earnings:</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency((investment.daily_profit_amount || (investment.amount_invested * investment.plans.profit_percent / 100) / investment.plans.duration_days) * calculateAvailableDays(investment))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {investment.status === 'completed' && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Investment completed! Earned {formatCurrency(expectedProfit)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
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

        {/* Customer Support for Investment Help */}
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
