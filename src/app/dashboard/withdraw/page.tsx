'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { ArrowLeft, AlertCircle, CheckCircle, CreditCard, HelpCircle } from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'

interface UserProfile {
  id: string
  full_name: string
  balance: number
  withdrawal_account_type: string | null
  withdrawal_account_name: string | null
  withdrawal_account_number: string | null
}

interface AdminSettings {
  min_withdrawal_amount: number
  withdrawal_fee_percent: number
}

export default function WithdrawPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
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

      // Fetch admin settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('min_withdrawal_amount, withdrawal_fee_percent')
        .eq('id', 1)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      setPageLoading(false)
    }

    fetchData()
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!user || !profile) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    const withdrawalAmount = parseFloat(amount)
    const minAmount = settings?.min_withdrawal_amount || 100
    const feePercent = settings?.withdrawal_fee_percent || 3
    const feeAmount = (withdrawalAmount * feePercent) / 100
    const amountAfterFee = withdrawalAmount - feeAmount
    const totalDeduction = withdrawalAmount

    if (withdrawalAmount <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    if (withdrawalAmount < minAmount) {
      setError(`Minimum withdrawal amount is PKR ${minAmount}`)
      setLoading(false)
      return
    }

    if (withdrawalAmount > profile.balance) {
      setError(`Insufficient funds. You need PKR ${withdrawalAmount.toFixed(2)}`)
      setLoading(false)
      return
    }

    if (!profile.withdrawal_account_type || !profile.withdrawal_account_name || !profile.withdrawal_account_number) {
      setError('Please bind your withdrawal account first in your profile')
      setLoading(false)
      return
    }


    try {
      // Use the decrement function to check and deduct balance
      const { data: balanceResult, error: balanceError } = await supabase.rpc('decrement_user_balance', {
        user_id: user.id,
        amount: withdrawalAmount
      })

      if (balanceError) throw balanceError

      if (!balanceResult) {
        setError('Insufficient funds')
        setLoading(false)
        return
      }

      // Create withdrawal record with local timestamp
      const { error: insertError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amountAfterFee,
          fee_amount: feeAmount,
          fee_percent: feePercent,
          total_deducted: withdrawalAmount,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      setSuccess(true)
      setAmount('')
      
      // Update local profile balance
      setProfile(prev => prev ? { ...prev, balance: prev.balance - withdrawalAmount } : null)
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit withdrawal request')
    }

    setLoading(false)
  }

  if (pageLoading) {
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

  if (success) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your withdrawal request has been submitted successfully. The amount has been deducted from your balance and will be processed within 24-48 hours.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              View Transaction History
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-3">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Withdraw Funds</h1>
      </div>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white mb-6">
        <h3 className="text-lg font-semibold mb-2">Available Balance</h3>
        <p className="text-3xl font-bold">{profile ? formatCurrency(profile.balance) : 'PKR 0.00'}</p>
      </div>

      {/* Account Information */}
      {profile?.withdrawal_account_type ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <CreditCard className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-900">Bound Withdrawal Account</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-600">Type:</span> <span className="font-medium">{profile.withdrawal_account_type}</span></p>
            <p><span className="text-gray-600">Name:</span> <span className="font-medium">{profile.withdrawal_account_name}</span></p>
            <p><span className="text-gray-600">Number:</span> <span className="font-medium">{profile.withdrawal_account_number}</span></p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-900">Account Not Bound</h3>
          </div>
          <p className="text-sm text-yellow-800 mb-3">
            You need to bind your withdrawal account before making withdrawals.
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700 transition-colors"
          >
            Bind Account in Profile
          </Link>
        </div>
      )}

      {/* Withdrawal Form */}
      {profile?.withdrawal_account_type && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Withdrawal Request</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (PKR)
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={settings?.min_withdrawal_amount || 100}
                max={profile.balance}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter withdrawal amount (Min: PKR ${settings?.min_withdrawal_amount || 100})`}
              />
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <p>Minimum: PKR {settings?.min_withdrawal_amount || 100}</p>
                <p>Maximum: {formatCurrency(profile.balance)}</p>
                <p>Withdrawal fee: {settings?.withdrawal_fee_percent || 3}%</p>
              </div>
            </div>


            {/* Fee Calculation Display */}
            {amount && parseFloat(amount) > 0 && settings && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Fee Calculation:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Withdrawal Request:</span>
                    <span>PKR {parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Fee ({settings.withdrawal_fee_percent}%):</span>
                    <span>- PKR {((parseFloat(amount) * settings.withdrawal_fee_percent) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Deducted from Balance:</span>
                    <span>PKR {parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>You will receive:</span>
                    <span>PKR {(parseFloat(amount) - (parseFloat(amount) * settings.withdrawal_fee_percent) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notice:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Withdrawal requests are processed within 24-48 hours</li>
                <li>• The amount will be deducted from your balance immediately</li>
                <li>• Funds will be sent to your bound account</li>
                <li>• Minimum withdrawal amount is PKR {settings?.min_withdrawal_amount || 100}</li>
                <li>• Withdrawal fee of {settings?.withdrawal_fee_percent || 3}% will be deducted</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !profile?.withdrawal_account_type}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>
      )}

      {/* Customer Support for Withdrawal Help */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Need Help with Withdrawal?
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Having issues with withdrawals or need help setting up your withdrawal account? Contact our support team for assistance.
          </p>
          <WhatsAppSupport variant="button" />
        </div>
      </div>
    </div>
  )
}
