'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile } from '@/lib/auth'
import { 
  Plus, 
  Minus, 
  Users, 
  History, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Star, 
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  DollarSign,
  Target,
  Award,
  Zap,
  HelpCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  User
} from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'
import AnnouncementPopup from '@/components/AnnouncementPopup'

interface Plan {
  id: number
  name: string
  duration_days: number
  profit_percent: number
  min_investment: number
  max_investment: number
  capital_return: boolean
  status: string
  purchase_limit_per_user: number | null
  user_purchase_count?: number
  can_purchase?: boolean
}

export default function DashboardHome() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState(0)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalEarnings: 0,
    totalWithdrawals: 0
  })

  useEffect(() => {
    // Clear service worker cache on mount
    const clearServiceWorkerCache = async () => {
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys()
          await Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName.includes('smartgrow')) {
                console.log('Clearing cache:', cacheName)
                return caches.delete(cacheName)
              }
            })
          )
        } catch (error) {
          console.warn('Failed to clear cache:', error)
        }
      }
    }

    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...')
        setLoading(true)
        
        // Clear cache first
        await clearServiceWorkerCache()
        
        // Fetch user profile and balance
        const { user, profile, error: userError } = await getCurrentUserWithProfile()
        if (userError || !user) {
          console.error('Error fetching user profile:', userError)
          setLoading(false)
          return
        }
        
        if (!profile) {
          console.warn('No profile found for user, creating default profile')
          // Set default values if profile is missing
          setUser(user)
          setProfile({ 
            id: user.id, 
            full_name: user.user_metadata?.full_name || 'User',
            balance: 0,
            user_level: 1 
          })
          setUserBalance(0)
        } else {
          console.log('User profile:', profile)
          setUser(user)
          setProfile(profile)
          setUserBalance(profile.balance || 0)
        }
        
        // Fetch user statistics (with error handling)
        if (user?.id) {
          await fetchUserStats(user.id)
        }
        
        // Fetch plans
        try {
          const { data, error } = await supabase
            .from('plans')
            .select('*')
            .in('status', ['Active', 'Premium'])
            .order('min_investment', { ascending: true })

          console.log('Plans data:', data)
          console.log('Plans error:', error)

          if (error) {
            console.error('Error fetching plans:', error)
            setPlans([]) // Set empty array on error
          } else if (data && user) {
            console.log('Setting plans:', data.length, 'plans found')
            
            // Check purchase limits for each plan
            try {
              const plansWithLimits = await Promise.all(
                data.map(async (plan: Plan) => {
                  try {
                    if (plan.purchase_limit_per_user) {
                      // Count user's purchases for this plan
                      const { count, error: countError } = await supabase
                        .from('investments')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .eq('plan_id', plan.id)
                      
                      if (countError) {
                        console.error('Error counting user purchases:', countError)
                        return {
                          ...plan,
                          user_purchase_count: 0,
                          can_purchase: true
                        }
                      }
                      
                      const userPurchaseCount = count || 0
                      const canPurchase = userPurchaseCount < plan.purchase_limit_per_user
                      
                      return {
                        ...plan,
                        user_purchase_count: userPurchaseCount,
                        can_purchase: canPurchase
                      }
                    }
                    
                    return {
                      ...plan,
                      user_purchase_count: 0,
                      can_purchase: true
                    }
                  } catch (planError) {
                    console.error('Error processing plan:', plan.id, planError)
                    return {
                      ...plan,
                      user_purchase_count: 0,
                      can_purchase: true
                    }
                  }
                })
              )
              
              setPlans(plansWithLimits)
            } catch (plansError) {
              console.error('Error processing plans with limits:', plansError)
              setPlans(data) // Set plans without limits on error
            }
          } else {
            setPlans([])
          }
        } catch (plansError) {
          console.error('Error in plans fetch:', plansError)
          setPlans([])
        }
        
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const fetchUserStats = async (userId: string) => {
    try {
      console.log('Fetching user stats for userId:', userId)
      
      // Debug: Fetch ALL deposits to see what statuses exist
      const { data: allDeposits, error: allDepositsError } = await supabase
        .from('deposits')
        .select('amount_pkr, status')
        .eq('user_id', userId)

      if (allDepositsError) {
        console.error('Error fetching all deposits:', allDepositsError)
      } else {
        console.log('ALL Deposits data (for debugging):', allDeposits)
      }

      // Fetch total deposits (only approved and completed, NOT pending)
      const { data: deposits, error: depositsError } = await supabase
        .from('deposits')
        .select('amount_pkr, status')
        .eq('user_id', userId)
        .in('status', ['approved', 'Approved', 'completed', 'Completed'])

      if (depositsError) {
        console.error('Error fetching approved deposits:', depositsError)
      } else {
        console.log('Approved Deposits data:', deposits)
      }

      // Fetch total withdrawals (check both 'approved' and 'Approved' status)
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .eq('user_id', userId)
        .in('status', ['approved', 'Approved'])

      if (withdrawalsError) {
        console.error('Error fetching withdrawals:', withdrawalsError)
      } else {
        console.log('Withdrawals data:', withdrawals)
      }

      // Fetch total earnings from investments (calculate based on investment amount and plan profit)
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select(`
          amount_invested,
          status,
          start_date,
          end_date,
          plans!inner(profit_percent, duration_days)
        `)
        .eq('user_id', userId)

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError)
      } else {
        console.log('Investments data:', investments)
      }

      // Only count APPROVED deposits (not pending ones)
      const totalDeposits = deposits?.reduce((sum, deposit) => sum + (deposit.amount_pkr || 0), 0) || 0
      const totalWithdrawals = withdrawals?.reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0) || 0
      
      // Calculate total earnings based on ONLY completed investments
      const totalEarnings = investments?.reduce((sum, investment: any) => {
        if (investment.status === 'completed') {
          const plan = investment.plans
          const profitPercent = plan?.profit_percent || 0
          const investmentAmount = investment.amount_invested || 0
          const earnings = (investmentAmount * profitPercent) / 100
          return sum + earnings
        }
        return sum
      }, 0) || 0

      console.log('Calculated stats:', { totalDeposits, totalEarnings, totalWithdrawals })

      setStats({
        totalDeposits,
        totalEarnings,
        totalWithdrawals
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Set default values on error
      setStats({
        totalDeposits: 0,
        totalEarnings: 0,
        totalWithdrawals: 0
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Loading dashboard...</p>
          <p className="text-slate-400 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Static Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        {/* Welcome Section */}
        <div className="px-6 pt-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Welcome dear, {user?.user_metadata?.full_name || profile?.full_name || 'User'}
              </h2>
              <p className="text-xs text-slate-400">Good to see you back!</p>
            </div>
          </div>
        </div>

        {/* Enhanced Balance Card */}
        <div className="px-6">
          <div className="relative mb-8 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-blue-900/50 to-purple-900/50 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl animate-gradient-x"></div>
            
            {/* Floating Orbs */}
            <div className="absolute top-4 right-8 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-6 left-8 w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-lg animate-pulse delay-1000"></div>
            
            {/* Main Card Content */}
            <div className="relative p-8 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                      <Wallet className="w-4 h-4 text-white" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-white animate-pulse"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                      Total Balance
                    </h3>
                    <p className="text-slate-400 text-xs">Available funds</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="group relative p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    {balanceVisible ? (
                      <EyeOff className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                    )}
                  </div>
                </button>
              </div>
              
              {/* Balance Display */}
              <div className="mb-4">
                <div className="text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-white via-green-200 to-emerald-300 bg-clip-text text-transparent">
                    {balanceVisible ? formatCurrency(userBalance) : '••••••••'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-sm font-medium">PKR Balance</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-400/30">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-semibold">Active</span>
                  </div>
                </div>
              </div>
              
              {/* Balance Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl mb-2 mx-auto">
                    <ArrowDownToLine className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-white/60 text-xs mb-1">Total Deposits</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(stats.totalDeposits)}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl mb-2 mx-auto">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-white/60 text-xs mb-1">Total Earnings</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-orange-500/20 rounded-xl mb-2 mx-auto">
                    <ArrowUpFromLine className="w-5 h-5 text-orange-400" />
                  </div>
                  <p className="text-white/60 text-xs mb-1">Withdrawals</p>
                  <p className="text-white font-semibold text-sm">{formatCurrency(stats.totalWithdrawals)}</p>
                </div>
              </div>
              
              {/* Quick Balance Actions */}
              <div className="flex space-x-3 mt-4">
                <Link href="/dashboard/deposit" className="flex-1">
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-green-400/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Deposit</span>
                    </div>
                  </button>
                </Link>
                
                <Link href="/dashboard/withdraw" className="flex-1">
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-red-400/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      <Minus className="w-4 h-4" />
                      <span>Withdraw</span>
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Investment Plans Section */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Investment Plans</h3>
                <p className="text-slate-400 text-sm">Choose your growth strategy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-xs font-medium">High Returns</span>
            </div>
          </div>
        
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 animate-pulse"
                >
                  <div className="h-5 bg-white/10 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-white/10 rounded w-1/4 mb-6"></div>
                  <div className="h-12 bg-white/10 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Premium Badge */}
                  {plan.status === 'Premium' && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                        <Star className="w-3 h-3" />
                        <span>PREMIUM</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="relative">
                    {/* Plan Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">{plan.name}</h4>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 px-2 py-1 bg-white/10 rounded-full">
                            <Clock className="w-3 h-3 text-blue-300" />
                            <span className="text-white text-xs">{plan.duration_days} days</span>
                          </div>
                          <div className="flex items-center space-x-2 px-2 py-1 bg-green-500/20 rounded-full">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 text-xs font-semibold">{plan.profit_percent}% Overall ROI</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div>
                          <div className="text-slate-400 text-xs">Minimum</div>
                          <div className="text-base font-bold text-white">{formatCurrency(plan.min_investment)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs">Maximum</div>
                          <div className="text-base font-bold text-green-400">{formatCurrency(plan.max_investment || 50000)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          <span className="text-white/80 text-xs">Capital Return: {plan.capital_return ? 'Yes' : 'No'}</span>
                        </div>
                        {plan.purchase_limit_per_user && (
                          <span className="text-white/60 text-xs">
                            {plan.user_purchase_count || 0}/{plan.purchase_limit_per_user} purchases
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Invest Button */}
                    {plan.can_purchase ? (
                      <Link href={`/dashboard/invest/${plan.id}`}>
                        <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group-hover:from-blue-400 group-hover:to-purple-500">
                          <div className="flex items-center justify-center space-x-2">
                            <span>Start Investment</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="w-full bg-gray-400 text-white text-center py-3 rounded-xl font-semibold cursor-not-allowed">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-sm">Purchase Limit Reached</span>
                          <span className="text-xs opacity-80">
                            {plan.user_purchase_count}/{plan.purchase_limit_per_user} purchases made
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && plans.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-white/60 text-lg mb-2">No investment plans available</p>
              <p className="text-white/40 text-sm">Check back later for new opportunities</p>
            </div>
          )}
        </div>

        {/* Customer Support Section */}
        <div className="mt-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center mb-4">
              <HelpCircle className="w-6 h-6 mr-3 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Need Assistance?</h3>
            </div>
            <p className="text-white/70 mb-4">
              Our support team is here to help you with investments, deposits, withdrawals, or any questions about the platform.
            </p>
            <WhatsAppSupport variant="button" className="bg-green-500 hover:bg-green-600" />
          </div>
        </div>
      </div>

      {/* Announcement Popup */}
      <AnnouncementPopup />
    </div>
  )
}
