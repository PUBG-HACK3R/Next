'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  withdrawal_account_type: string | null
  withdrawal_account_name: string | null
  withdrawal_account_number: string | null
}

export default function BindAccountPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [accountType, setAccountType] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { user } = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setAccountType(profileData.withdrawal_account_type || '')
        setAccountName(profileData.withdrawal_account_name || '')
        setAccountNumber(profileData.withdrawal_account_number || '')
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleSave = async () => {
    if (!accountType || !accountName || !accountNumber) {
      setError('Please fill in all fields')
      return
    }

    if (accountType === 'bank' && !bankName) {
      setError('Please enter bank name')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          withdrawal_account_type: accountType,
          withdrawal_account_name: accountName,
          withdrawal_account_number: accountNumber
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Account information saved successfully!')
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          withdrawal_account_type: accountType,
          withdrawal_account_name: accountName,
          withdrawal_account_number: accountNumber
        })
      }
    } catch (error: any) {
      setError('Failed to save account information: ' + error.message)
    }

    setSaving(false)
  }

  const accountTypes = [
    { value: 'bank', label: 'Bank Account', icon: Building2 },
    { value: 'easypaisa', label: 'EasyPaisa', icon: Smartphone },
    { value: 'jazzcash', label: 'JazzCash', icon: Smartphone }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-blue-900 border-b-2 border-blue-400 sticky top-0 z-40" style={{boxShadow: '0 2px 20px rgba(59, 130, 246, 0.5)'}}>
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/profile">
              <ArrowLeft className="w-6 h-6 text-white hover:text-blue-200 transition-colors" />
            </Link>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Bind Account
              </h1>
              <p className="text-xs text-slate-400">Link your payment accounts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Account Type Selection */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">Account Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {accountTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setAccountType(type.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  accountType === type.value
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <type.icon className={`w-6 h-6 ${
                    accountType === type.value ? 'text-blue-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    accountType === type.value ? 'text-blue-400' : 'text-white'
                  }`}>
                    {type.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Account Details */}
        {accountType && (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Account Details</h2>
            
            {accountType === 'bank' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter bank name (e.g., HBL, UBL, MCB)"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter account holder name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {accountType === 'bank' ? 'Account Number' : 'Mobile Number'}
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={
                  accountType === 'bank' ? 'Enter account number' : 'Enter mobile number'
                }
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Account'}</span>
            </button>
          </div>
        )}

        {/* Current Account Info */}
        {profile?.withdrawal_account_type && (
          <div className="bg-green-500/20 backdrop-blur-xl rounded-xl p-6 border border-green-500/50">
            <h2 className="text-lg font-semibold text-green-200 mb-4">Current Linked Account</h2>
            <div className="space-y-2">
              <p className="text-green-100">
                <span className="font-medium">Type:</span> {profile.withdrawal_account_type?.toUpperCase()}
              </p>
              <p className="text-green-100">
                <span className="font-medium">Name:</span> {profile.withdrawal_account_name}
              </p>
              <p className="text-green-100">
                <span className="font-medium">Number:</span> {profile.withdrawal_account_number}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
