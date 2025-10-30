'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Calculator
} from 'lucide-react'

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
}


interface UserProfile {
  id: string
  full_name: string
  balance: number
}

export default function InvestPage() {
  const params = useParams()
  const router = useRouter()
  const planId = parseInt(params.id as string)
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [investing, setInvesting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [canPurchase, setCanPurchase] = useState(true)
  const [purchaseCount, setPurchaseCount] = useState(0)

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

      // Fetch plan details
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) {
        setError('Plan not found')
        setLoading(false)
        return
      }


      if (planData) {
        setPlan(planData)
        setAmount(planData.min_investment.toString())
        
        // Check purchase limit
        if (planData.purchase_limit_per_user) {
          const { count } = await supabase
            .from('investments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('plan_id', planId)
          
          const userPurchaseCount = count || 0
          setPurchaseCount(userPurchaseCount)
          
          if (userPurchaseCount >= planData.purchase_limit_per_user) {
            setCanPurchase(false)
            setError(`You have reached the maximum purchase limit (${planData.purchase_limit_per_user} times) for this plan. Please choose another plan.`)
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [router, planId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateReturns = () => {
    if (!plan || !amount) return { profit: 0, total: 0 }
    
    const investmentAmount = parseFloat(amount)
    const profit = (investmentAmount * plan.profit_percent) / 100
    const total = plan.capital_return ? investmentAmount + profit : profit
    
    return { profit, total }
  }

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvesting(true)
    setError('')

    if (!user || !profile || !plan) {
      setError('Missing required data')
      setInvesting(false)
      return
    }

    const investmentAmount = parseFloat(amount)

    // Validation
    if (investmentAmount < plan.min_investment) {
      setError(`Minimum investment is ${formatCurrency(plan.min_investment)}`)
      setInvesting(false)
      return
    }

    const maxAmount = plan.max_investment || 50000
    if (investmentAmount > maxAmount) {
      setError(`Maximum investment is ${formatCurrency(maxAmount)}`)
      setInvesting(false)
      return
    }

    if (investmentAmount > profile.balance) {
      setError('Insufficient balance')
      setInvesting(false)
      return
    }

    try {
      // Calculate end date
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + plan.duration_days)

      // Deduct amount from balance
      const { data: balanceResult, error: balanceError } = await supabase.rpc('decrement_user_balance', {
        user_id: user.id,
        amount: investmentAmount
      })

      if (balanceError) throw balanceError

      if (!balanceResult) {
        setError('Insufficient balance')
        setInvesting(false)
        return
      }

      // Create investment record
      const { error: investmentError } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          amount_invested: investmentAmount,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })

      if (investmentError) throw investmentError

      setSuccess(true)
      
      // Update local profile balance
      setProfile(prev => prev ? { ...prev, balance: prev.balance - investmentAmount } : null)

    } catch (err: any) {
      setError(err.message || 'Failed to create investment')
    }

    setInvesting(false)
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Plan Not Found</h3>
          <p className="text-gray-500 mb-4">The investment plan you're looking for doesn't exist.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Investment Successful!</h2>
          <p className="text-gray-600 mb-6">
            You have successfully invested {formatCurrency(parseFloat(amount))} in {plan.name}.
            Your investment will mature in {plan.duration_days} days.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard/my-investments"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              View My Investments
            </Link>
            <Link
              href="/dashboard"
              className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { profit, total } = calculateReturns()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-3">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-xl font-bold text-white">Invest in {plan.name}</h1>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* Plan Card - Compact */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">{plan.name}</h2>
            <div className="bg-green-500/20 px-3 py-1 rounded-full">
              <span className="text-green-400 text-sm font-semibold">{plan.profit_percent}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-slate-400 text-xs">Duration</p>
                <p className="text-white font-medium">{plan.duration_days} Days</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-slate-400 text-xs">Min Amount</p>
                <p className="text-white font-medium">{formatCurrency(plan.min_investment)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card - Compact */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Available Balance</p>
              <p className="text-xl font-bold text-white">
                {profile ? formatCurrency(profile.balance) : 'PKR 0.00'}
              </p>
            </div>
            <Link
              href="/dashboard/deposit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Add Funds
            </Link>
          </div>
        </div>

        {/* Investment Form - Compact */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <form onSubmit={handleInvest} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">
                Investment Amount (PKR)
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={plan.min_investment}
                max={Math.min(profile?.balance || 0, plan.max_investment || 50000)}
                step="1"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAmount(plan.min_investment.toString())}
                className="bg-white/10 text-white py-2 px-3 rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/20"
              >
                Min
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.floor((profile?.balance || 0) / 2).toString())}
                className="bg-white/10 text-white py-2 px-3 rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/20"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.min(profile?.balance || 0, plan.max_investment || 50000).toString())}
                className="bg-white/10 text-white py-2 px-3 rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/20"
              >
                Max
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Expected Profit - Inline */}
            {amount && parseFloat(amount) >= plan.min_investment && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Expected Profit:</span>
                  <span className="font-bold text-green-400">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                  <span>Profit: {formatCurrency(profit)}</span>
                  <span>In {plan.duration_days} days</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={investing || !amount || parseFloat(amount) < plan.min_investment || !canPurchase}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <TrendingUp className="w-5 h-5" />
              <span>{!canPurchase ? 'Purchase Limit Reached' : (investing ? 'Processing...' : 'Start Investment')}</span>
            </button>
            
            {plan.purchase_limit_per_user && (
              <div className="text-center text-sm text-slate-400">
                Purchases: {purchaseCount}/{plan.purchase_limit_per_user}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
