'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import { 
  User, 
  CreditCard, 
  LogOut, 
  Save, 
  Eye, 
  EyeOff,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'

interface UserProfile {
  id: string
  full_name: string
  balance: number
  user_level: number
  withdrawal_account_type: string | null
  withdrawal_account_name: string | null
  withdrawal_account_number: string | null
  referred_by: string | null
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [accountType, setAccountType] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  
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
        setFullName(profileData.full_name)
        setAccountType(profileData.withdrawal_account_type || '')
        setAccountName(profileData.withdrawal_account_name || '')
        setAccountNumber(profileData.withdrawal_account_number || '')
      }
      setLoading(false)
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!user) {
      setError('User not authenticated')
      setSaving(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: fullName,
      } : null)

      setSuccess('Profile updated successfully!')
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    }

    setSaving(false)
  }

  const handleSaveWithdrawalAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!user) {
      setError('User not authenticated')
      setSaving(false)
      return
    }

    // Validate that account name and number are provided
    if (!accountName.trim() || !accountNumber.trim()) {
      setError('Please provide both account name and number')
      setSaving(false)
      return
    }

    try {
      // Check if another user already has the same account name and number combination
      const { data: existingAccount, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('withdrawal_account_name', accountName.trim())
        .eq('withdrawal_account_number', accountNumber.trim())
        .neq('id', user.id)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingAccount) {
        setError('This account name and number combination is already bound to another user account')
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          withdrawal_account_type: accountType || null,
          withdrawal_account_name: accountName.trim() || null,
          withdrawal_account_number: accountNumber.trim() || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        withdrawal_account_type: accountType || null,
        withdrawal_account_name: accountName.trim() || null,
        withdrawal_account_number: accountNumber.trim() || null,
      } : null)

      setSuccess('Withdrawal account updated successfully!')
      
    } catch (err: any) {
      setError(err.message || 'Failed to update withdrawal account')
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const getUserLevelBadge = (level: number) => {
    if (level >= 999) {
      return { text: 'Administrator', color: 'bg-purple-100 text-purple-800' }
    } else if (level >= 10) {
      return { text: 'VIP Member', color: 'bg-gold-100 text-gold-800' }
    } else if (level >= 5) {
      return { text: 'Premium Member', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { text: 'Basic Member', color: 'bg-gray-100 text-gray-800' }
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const levelBadge = getUserLevelBadge(profile?.user_level || 1)

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{profile?.full_name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${levelBadge.color}`}>
              {levelBadge.text}
            </span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Account Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalance ? (profile ? formatCurrency(profile.balance) : 'PKR 0.00') : '••••••'}
              </p>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Account Information Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Account Information
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Withdrawal Account Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Withdrawal Account
        </h3>

        <form onSubmit={handleSaveWithdrawalAccount} className="space-y-4">
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              id="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select account type</option>
              <option value="Bank">Bank Account</option>
              <option value="Easypaisa">Easypaisa</option>
              <option value="JazzCash">JazzCash</option>
            </select>
          </div>

          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              id="accountName"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter account holder name"
            />
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              id="accountNumber"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter account number"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">Important:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This account will be used for all withdrawal requests</li>
              <li>• Make sure the account details are correct</li>
              <li>• Account holder name should match your profile name</li>
              <li>• Each account name and number combination can only be bound to one user</li>
              <li>• You can update these details anytime</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Withdrawal Account'}
          </button>
        </form>
      </div>

      {/* Referral Information */}
      {profile?.referred_by && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Referral Information
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              You were referred by user ID: <span className="font-medium">{profile.referred_by.slice(0, 8)}...</span>
            </p>
          </div>
        </div>
      )}

      {/* Customer Support */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Customer Support
        </h3>
        <div className="space-y-4">
          <p className="text-gray-600">
            Need help with your account or have questions? Our support team is here to assist you.
          </p>
          <WhatsAppSupport variant="button" className="w-full" />
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
