'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Award,
  Zap,
  Archive,
  Eye,
  EyeOff,
  ArrowUpRight,
  LockIcon
} from 'lucide-react'

// Optimized hooks
import { useInvestments, useCompletedInvestments, useCollectIncome } from '@/hooks/useInvestments'
import { useUserProfile, useEarningsStats } from '@/hooks/useUserData'

// Optimized UI components
import { PageLoadingSkeleton, InvestmentCardSkeleton, StatsGridSkeleton } from '@/components/ui/Skeleton'

export default function OptimizedMyInvestmentsPage() {
  const [showExpiredPlans, setShowExpiredPlans] = useState(false)
  const router = useRouter()

  // React Query hooks - all data fetched in parallel with caching
  const { data: investmentData, isLoading: investmentsLoading, error: investmentsError } = useInvestments()
  const { data: completedInvestments, isLoading: completedLoading } = useCompletedInvestments()
  const { data: profile, isLoading: profileLoading } = useUserProfile()
  const { data: earningsStats, isLoading: earningsLoading } = useEarningsStats()
  
  // Mutation for collecting income
  const collectIncomeMutation = useCollectIncome()

  // Loading state - show skeleton while any critical data is loading
  const isLoading = investmentsLoading || profileLoading

  // Error handling
  if (investmentsError) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-4">Failed to load investments</div>
        <button 
          onClick={() => router.refresh()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    )
  }

  // Show loading skeleton
  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  const { investments = [], stats } = investmentData || {}
  const activeInvestments = investments.filter(inv => inv.status === 'active')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateAvailableDays = (investment: any) => {
    const now = new Date()
    const remainingDays = investment.plans.duration_days - (investment.total_days_collected || 0)
    
    let daysSinceReference: number
    
    if (investment.last_income_collection_date) {
      const lastCollection = new Date(investment.last_income_collection_date)
      daysSinceReference = Math.floor((now.getTime() - lastCollection.getTime()) / (24 * 60 * 60 * 1000))
    } else {
      const startDate = new Date(investment.start_date)
      daysSinceReference = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    }
    
    return Math.min(daysSinceReference, remainingDays)
  }

  const canCollectToday = (investment: any) => {
    if (investment.status !== 'active') return false
    return calculateAvailableDays(investment) > 0
  }

  const handleCollectIncome = async (investmentId: number) => {
    try {
      await collectIncomeMutation.mutateAsync({ investmentId })
    } catch (error) {
      console.error('Error collecting income:', error)
    }
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

      {/* Stats Grid - Show skeleton if stats loading */}
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {/* Total Invested */}
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-lg hover:shadow-inner transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-blue-500 rounded-md shadow-md">
                <DollarSign className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[9px] text-gray-600 font-semibold">Total Invested</p>
            </div>
            <p className="text-sm font-black text-gray-900">{formatCurrency(stats.totalInvested)}</p>
          </div>

          {/* Active */}
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-lg hover:shadow-inner transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-green-500 rounded-md shadow-md">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[9px] text-gray-600 font-semibold">Active</p>
            </div>
            <p className="text-sm font-black text-gray-900">{stats.activeInvestments}</p>
          </div>

          {/* Completed */}
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-lg hover:shadow-inner transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-purple-500 rounded-md shadow-md">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[9px] text-gray-600 font-semibold">Completed</p>
            </div>
            <p className="text-sm font-black text-gray-900">{stats.completedInvestments}</p>
          </div>

          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-lg hover:shadow-inner transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-orange-500 rounded-md shadow-md">
                <Archive className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[9px] text-gray-600 font-semibold">Total Earnings</p>
            </div>
            <p className="text-sm font-black text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
          </div>

          {/* Locked Earnings */}
          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-lg hover:shadow-inner transition-all duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="p-1 bg-gradient-to-br from-red-500 to-rose-600 rounded-md shadow-lg">
                <LockIcon className="w-3.5 h-3.5 text-yellow-300 stroke-[2.5]" />
              </div>
              <p className="text-[9px] text-gray-600 font-semibold">Locked Earnings</p>
            </div>
            <p className="text-sm font-black text-gray-900">{formatCurrency(profile?.earned_balance || 0)}</p>
            <p className="text-[8px] text-gray-600 mt-1">Available on Completion</p>
          </div>
        </div>
      ) : (
        <StatsGridSkeleton />
      )}

      {/* Active Investments */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Active Investments</h3>
        
        {activeInvestments.length === 0 ? (
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
            {activeInvestments.map((investment) => {
              const expectedProfit = (investment.amount_invested * investment.plans.profit_percent) / 100
              const dailyProfit = expectedProfit / investment.plans.duration_days

              return (
                <div key={investment.id} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-800 mb-0.5">{investment.plans.name}</h3>
                      <p className="text-xs text-gray-600">Started {formatDate(investment.start_date)}</p>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full shadow-inner">
                      <span className="text-xs font-bold flex items-center gap-1 text-green-600">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-500"></div>
                        <span className="capitalize">{investment.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2 shadow-md">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="p-1 bg-blue-500 rounded-md shadow-sm">
                          <DollarSign className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-gray-600 text-[9px] font-semibold">Invested</p>
                      </div>
                      <p className="text-gray-900 font-black text-xs">{formatCurrency(investment.amount_invested)}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2 shadow-md">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="p-1 bg-green-500 rounded-md shadow-sm">
                          <TrendingUp className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-gray-600 text-[9px] font-semibold">Profit</p>
                      </div>
                      <p className="text-green-600 font-black text-xs">{investment.plans.profit_percent}%</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2 shadow-md">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="p-1 bg-purple-500 rounded-md shadow-sm">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-gray-600 text-[9px] font-semibold">Days</p>
                      </div>
                      <p className="text-gray-900 font-black text-xs">{investment.plans.duration_days}d</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2 shadow-md">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="p-1 bg-pink-500 rounded-md shadow-sm">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-gray-600 text-[9px] font-semibold">Profit</p>
                      </div>
                      <p className="text-blue-600 font-black text-xs">{formatCurrency(expectedProfit)}</p>
                    </div>
                  </div>

                  {/* Collection Section */}
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-3 mb-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="w-4 h-4 text-green-600" />
                          <p className="text-gray-700 text-xs font-bold">Daily Profit Available</p>
                        </div>
                        <p className="text-gray-900 font-black text-xl mb-2">
                          {formatCurrency(dailyProfit)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-600">
                          <span className="flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" />
                            {investment.total_days_collected || 0}/{investment.plans.duration_days}
                          </span>
                          <span>•</span>
                          <span>Last: {investment.last_income_collection_date ? formatDate(investment.last_income_collection_date) : 'Never'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCollectIncome(investment.id)}
                        disabled={!canCollectToday(investment) || collectIncomeMutation.isPending}
                        className={`px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm ${
                          canCollectToday(investment) && !collectIncomeMutation.isPending
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {collectIncomeMutation.isPending ? 'COLLECTING...' : 'COLLECT'}
                      </button>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-400/30">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>ID: {investment.id}</span>
                      </span>
                      {investment.plans.capital_return && (
                        <span className="text-green-600 font-semibold">✓ Capital Return</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Completed Plans Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Archive className="w-4 h-4 mr-1.5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-900">Completed Plans Earnings</h3>
            </div>
            <button
              onClick={() => setShowExpiredPlans(!showExpiredPlans)}
              className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {showExpiredPlans ? (
                <EyeOff className="w-3 h-3 text-gray-600" />
              ) : (
                <Eye className="w-3 h-3 text-gray-600" />
              )}
              <span className="text-[10px] font-medium text-gray-700">
                {showExpiredPlans ? 'Hide' : 'View'} ({completedInvestments?.length || 0})
              </span>
            </button>
          </div>

          {/* Earnings Stats Cards */}
          {earningsStats ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-md p-2 text-white">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-green-100 text-[10px] font-medium">Today</span>
                  <ArrowUpRight className="w-2.5 h-2.5 text-green-200" />
                </div>
                <div className="text-sm font-bold leading-tight">{formatCurrency(earningsStats.todayEarnings)}</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md p-2 text-white">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-blue-100 text-[10px] font-medium">Yesterday</span>
                  <TrendingUp className="w-2.5 h-2.5 text-blue-200" />
                </div>
                <div className="text-sm font-bold leading-tight">{formatCurrency(earningsStats.yesterdayEarnings)}</div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-md p-2 text-white">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-purple-100 text-[10px] font-medium">Total</span>
                  <DollarSign className="w-2.5 h-2.5 text-purple-200" />
                </div>
                <div className="text-sm font-bold leading-tight">{formatCurrency(earningsStats.totalExpiredEarnings)}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 rounded-md p-2 animate-pulse">
                  <div className="h-3 bg-gray-300 rounded mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Plans List */}
          {showExpiredPlans && (
            <div className="space-y-2 mt-3">
              {completedLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <InvestmentCardSkeleton key={i} />
                  ))}
                </div>
              ) : completedInvestments?.length === 0 ? (
                <div className="text-center py-4">
                  <Archive className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">No completed plans found</p>
                </div>
              ) : (
                completedInvestments?.map((investment) => {
                  const profit = (investment.amount_invested * investment.plans.profit_percent) / 100
                  
                  return (
                    <div key={investment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{investment.plans.name}</h4>
                          <p className="text-xs text-gray-600">Completed {formatDate(investment.updated_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{formatCurrency(profit)}</p>
                          <p className="text-xs text-gray-500">Profit Earned</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
