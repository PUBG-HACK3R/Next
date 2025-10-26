'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift,
  TrendingUp,
  DollarSign
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  user_level: number
  referral_code: string
}

interface AdminSettings {
  referral_l1_percent: number
  referral_l2_percent: number
  referral_l3_percent: number
}

interface ReferralStats {
  level1Count: number
  level2Count: number
  level3Count: number
  totalEarnings: number
}

export default function InvitePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [stats, setStats] = useState<ReferralStats>({
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    totalEarnings: 0
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const fetchReferralStats = async (referralCode: string, userId: string) => {
    try {
      
      // Count Level 1 referrals (direct referrals)
      // Note: referred_by stores the USER ID, not the referral code
      const { data: level1Data, error: level1Error } = await supabase
        .from('user_profiles')
        .select('id, referral_code, full_name, referred_by')
        .eq('referred_by', userId)

      if (level1Error) throw level1Error
      

      const level1Count = level1Data?.length || 0
      const level1UserIds = level1Data?.map(user => user.id) || []

      // Count Level 2 referrals (referrals of referrals)
      let level2Count = 0
      if (level1UserIds.length > 0) {
        // Level 2 users are those referred by Level 1 users
        const { data: level2Data, error: level2Error } = await supabase
          .from('user_profiles')
          .select('id')
          .in('referred_by', level1UserIds)

        if (!level2Error) {
          level2Count = level2Data?.length || 0
        }
      }

      // Count Level 3 referrals (would be similar logic, simplified for now)
      let level3Count = 0
      // TODO: Implement level 3 counting if needed

      // Calculate total earnings from referral commissions
      const { data: commissionData, error: commissionError } = await supabase
        .from('referral_commissions')
        .select('commission_amount')
        .eq('referrer_id', userId)

      let totalEarnings = 0
      if (!commissionError && commissionData) {
        totalEarnings = commissionData.reduce((sum, commission) => sum + commission.commission_amount, 0)
      }
      
      setStats({
        level1Count,
        level2Count,
        level3Count,
        totalEarnings
      })

    } catch (error) {
      console.error('Error fetching referral stats:', error)
      // Set default values on error
      setStats({
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        totalEarnings: 0
      })
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

      const { data: profileData } = await getUserProfile(user.id)
      if (profileData) {
        setProfile(profileData)
      }

      // Fetch admin settings for referral percentages
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('referral_l1_percent, referral_l2_percent, referral_l3_percent')
        .eq('id', 1)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      // Fetch referral stats from database
      if (profileData?.referral_code) {
        await fetchReferralStats(profileData.referral_code, user.id)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const getReferralLink = () => {
    if (!profile?.referral_code) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/signup?ref=${profile.referral_code}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareReferralLink = async () => {
    const referralLink = getReferralLink()
    const shareText = `Join SmartGrow Mining and start investing in cryptocurrency mining projects! Use my referral link: ${referralLink}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SmartGrow Mining',
          text: shareText,
          url: referralLink,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Friends</h1>
        <p className="text-gray-600">Earn commissions by referring new investors</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center mb-4">
          <Gift className="w-6 h-6 mr-2" />
          <h2 className="text-lg font-semibold">Your Referral Link</h2>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-white/30">
          <p className="text-sm font-mono break-all text-gray-800 font-medium">{getReferralLink()}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center space-x-2 bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex-1 font-medium shadow-sm"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={shareReferralLink}
            className="flex items-center justify-center space-x-2 bg-white text-green-600 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex-1 font-medium shadow-sm"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Commission Rates */}
      {settings && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Commission Structure
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-blue-600">L1</span>
              </div>
              <p className="text-sm text-gray-600">Direct Referrals</p>
              <p className="text-xl font-bold text-blue-600">{settings.referral_l1_percent}%</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-green-600">L2</span>
              </div>
              <p className="text-sm text-gray-600">2nd Level</p>
              <p className="text-xl font-bold text-green-600">{settings.referral_l2_percent}%</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-purple-600">L3</span>
              </div>
              <p className="text-sm text-gray-600">3rd Level</p>
              <p className="text-xl font-bold text-purple-600">{settings.referral_l3_percent}%</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Level 1:</strong> Earn {settings.referral_l1_percent}% commission on direct referrals' deposits</li>
              <li>• <strong>Level 2:</strong> Earn {settings.referral_l2_percent}% commission on your referrals' referrals</li>
              <li>• <strong>Level 3:</strong> Earn {settings.referral_l3_percent}% commission on 3rd level referrals</li>
              <li>• Commissions are paid when referred users make deposits</li>
            </ul>
          </div>
        </div>
      )}

      {/* Referral Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Your Referral Stats
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Level 1 Referrals</p>
            <p className="text-2xl font-bold text-blue-600">{stats.level1Count}</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Level 2 Referrals</p>
            <p className="text-2xl font-bold text-green-600">{stats.level2Count}</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Level 3 Referrals</p>
            <p className="text-2xl font-bold text-purple-600">{stats.level3Count}</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        {stats.level1Count === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h4>
            <p className="text-gray-500 mb-4">Start sharing your referral link to earn commissions!</p>
          </div>
        )}
      </div>

      {/* How to Refer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Refer Friends</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-600">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Share Your Link</h4>
              <p className="text-sm text-gray-600">Copy and share your unique referral link with friends and family.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-600">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">They Sign Up</h4>
              <p className="text-sm text-gray-600">When someone uses your link to create an account, they become your referral.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-600">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Earn Commissions</h4>
              <p className="text-sm text-gray-600">You earn commissions when your referrals make deposits and investments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for Success */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Tips for Success</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Share your experience with SmartGrow Mining</li>
          <li>• Explain the benefits of cryptocurrency mining investments</li>
          <li>• Be transparent about risks and returns</li>
          <li>• Help your referrals understand the platform</li>
          <li>• Stay active and engaged with your network</li>
        </ul>
      </div>
    </div>
  )
}
