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
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-3">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Invest in {plan.name}</h1>
      </div>

      {/* Plan Details */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white mb-6">
        <h2 className="text-xl font-semibold mb-4">{plan.name}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <div>
              <p className="text-xs opacity-90">Duration</p>
              <p className="text-sm font-semibold">{plan.duration_days} Days</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-3 h-3" />
            <div>
              <p className="text-xs opacity-90">Profit Rate</p>
              <p className="text-sm font-semibold">{plan.profit_percent}%</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-3 h-3" />
            <div>
              <p className="text-xs opacity-90">Min Investment</p>
              <p className="text-sm font-semibold">{formatCurrency(plan.min_investment)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DollarSign className="w-3 h-3" />
            <div>
              <p className="text-xs opacity-90">Max Investment</p>
              <p className="text-sm font-semibold">{formatCurrency(plan.max_investment || 50000)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-3 h-3" />
            <div>
              <p className="text-xs opacity-90">Capital Return</p>
              <p className="text-sm font-semibold">{plan.capital_return ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600">Available Balance</p>
            <p className="text-xl font-bold text-blue-900">
              {profile ? formatCurrency(profile.balance) : 'PKR 0.00'}
            </p>
          </div>
          <Link
            href="/dashboard/deposit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Add Funds
          </Link>
        </div>
      </div>

      {/* Investment Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Investment Amount</h3>
        
        <form onSubmit={handleInvest} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (PKR)
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter investment amount"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Min: {formatCurrency(plan.min_investment)}</span>
              <span>Max: {formatCurrency(plan.max_investment || 50000)}</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAmount(plan.min_investment.toString())}
              className="bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              Minimum
            </button>
            <button
              type="button"
              onClick={() => setAmount(Math.floor((profile?.balance || 0) / 2).toString())}
              className="bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmount(Math.min(profile?.balance || 0, plan.max_investment || 50000).toString())}
              className="bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              Max Available
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={investing || !amount || parseFloat(amount) < plan.min_investment || !canPurchase}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!canPurchase ? 'Purchase Limit Reached' : (investing ? 'Processing Investment...' : 'Invest Now')}
          </button>
          
          {plan.purchase_limit_per_user && (
            <div className="text-center text-sm text-gray-600">
              Purchases: {purchaseCount}/{plan.purchase_limit_per_user}
            </div>
          )}
        </form>
      </div>

      {/* Return Calculator */}
      {amount && parseFloat(amount) >= plan.min_investment && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Expected Returns
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Investment Amount:</span>
              <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Profit ({plan.profit_percent}%):</span>
              <span className="font-semibold text-green-600">+{formatCurrency(profit)}</span>
            </div>
            
            {plan.capital_return && (
              <div className="flex justify-between">
                <span className="text-gray-600">Capital Return:</span>
                <span className="font-semibold">+{formatCurrency(parseFloat(amount))}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-gray-900 font-semibold">Total Return:</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <strong>Maturity Date:</strong> {new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toLocaleDateString('en-PK')}
              </p>
              <p className="text-sm text-green-800 mt-1">
                Your investment will mature in {plan.duration_days} days and returns will be credited to your account.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
