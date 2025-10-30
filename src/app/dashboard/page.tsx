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
  ArrowUpFromLine
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

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching dashboard data...')
      
      // Fetch user profile and balance
      const { user, profile, error: userError } = await getCurrentUserWithProfile()
      if (userError || !user || !profile) {
        console.error('Error fetching user profile:', userError)
        setLoading(false)
        return
      }
      
      console.log('User profile:', profile)
      setUser(user)
      setUserBalance(profile.balance || 0)
      
      // Fetch plans
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .in('status', ['Active', 'Premium'])
        .order('min_investment', { ascending: true })

      console.log('Plans data:', data)
      console.log('Plans error:', error)

      if (error) {
        console.error('Error fetching plans:', error)
      }

      if (data && user) {
        console.log('Setting plans:', data.length, 'plans found')
        
        // Check purchase limits for each plan
        const plansWithLimits = await Promise.all(
          data.map(async (plan: Plan) => {
            if (plan.purchase_limit_per_user) {
              // Count user's purchases for this plan
              const { count } = await supabase
                .from('investments')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('plan_id', plan.id)
              
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
          })
        )
        
        setPlans(plansWithLimits)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const quickActions = [
    {
      href: '/dashboard/deposit',
      icon: Plus,
      label: 'Deposit',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      href: '/dashboard/withdraw',
      icon: Minus,
      label: 'Withdraw',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      href: '/dashboard/wallet',
      icon: Wallet,
      label: 'Wallet',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      href: '/dashboard/history',
      icon: History,
      label: 'History',
      color: 'bg-gray-500 hover:bg-gray-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Static Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        {/* Modern Header */}
        <div className="px-6 pt-6">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
          </div>
        </div>

        {/* SmartGrow Icon Section */}
        <div className="px-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg relative">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-500"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SmartGrow</h2>
              <p className="text-xs text-slate-400">Investment Platform</p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="px-6">
          <div className="relative mb-8 p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-blue-300" />
                  <span className="text-white/80 text-sm font-medium">Total Balance</span>
                </div>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-150"
                >
                  {balanceVisible ? (
                    <EyeOff className="w-4 h-4 text-white/60" />
                  ) : (
                    <Eye className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
              
              <div className="text-4xl font-bold text-white mb-2">
                {balanceVisible ? formatCurrency(userBalance) : '••••••'}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white/60 text-sm">PKR Balance</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { href: '/dashboard/deposit', icon: ArrowDownToLine, label: 'Deposit', color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/25' },
              { href: '/dashboard/withdraw', icon: ArrowUpFromLine, label: 'Withdraw', color: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/25' },
              { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet', color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/25' },
              { href: '/dashboard/history', icon: History, label: 'History', color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/25' }
            ].map((action, index) => (
              <div key={action.href}>
                <Link href={action.href}>
                  <div className={`relative p-4 bg-gradient-to-br ${action.color} rounded-2xl shadow-lg ${action.shadow} overflow-hidden group hover:scale-105 transition-transform duration-150`}>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex flex-col items-center space-y-2">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium">{action.label}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
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
