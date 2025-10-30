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
  DollarSign,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Search,
  Filter,
  ChevronDown,
  Star,
  Trophy,
  Zap
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
  todayEarnings: number
  yesterdayEarnings: number
  level1Earnings: number
  level2Earnings: number
  level3Earnings: number
}

interface ReferralUser {
  id: string
  full_name: string
  email: string
  referral_code: string
  created_at: string
  level: number
  totalDeposits: number
  totalWithdrawals: number
  totalEarnings: number
  isActive: boolean
}

export default function InvitePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [stats, setStats] = useState<ReferralStats>({
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    yesterdayEarnings: 0,
    level1Earnings: 0,
    level2Earnings: 0,
    level3Earnings: 0
  })
  const [referralHistory, setReferralHistory] = useState<ReferralUser[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('joinDate')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showFilterDropdown && !target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilterDropdown])

  const fetchReferralStats = async (referralCode: string, userId: string) => {
    try {
      // Count Level 1 referrals (direct referrals)
      // Note: referred_by stores the USER ID, not the referral code
      const { data: level1Data, error: level1Error } = await supabase
        .from('user_profiles')
        .select('id, referral_code, full_name, referred_by, created_at')
        .eq('referred_by', userId)

      if (level1Error) throw level1Error
      

      const level1Count = level1Data?.length || 0
      const level1UserIds = level1Data?.map(user => user.id) || []

      // Count Level 2 referrals (referrals of referrals)
      let level2Count = 0
      if (level1Data && level1Data.length > 0) {
        // Level 2 users are those referred by Level 1 users (using their user IDs)
        const level1UserIds = level1Data.map(user => user.id)
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

      // Calculate earnings from referral commissions
      const { data: commissionData, error: commissionError } = await supabase
        .from('referral_commissions')
        .select('commission_amount, level, created_at')
        .eq('referrer_id', userId)

      let totalEarnings = 0
      let todayEarnings = 0
      let yesterdayEarnings = 0
      let level1Earnings = 0
      let level2Earnings = 0
      let level3Earnings = 0
      
      if (!commissionError && commissionData) {
        // Get today's date in UTC to match database timestamps
        const now = new Date()
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        const yesterday = new Date(today)
        yesterday.setUTCDate(yesterday.getUTCDate() - 1)
        const tomorrow = new Date(today)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
        
        commissionData.forEach(commission => {
          const amount = commission.commission_amount
          totalEarnings += amount
          
          // Calculate today's and yesterday's earnings using UTC date comparison
          const commissionDate = new Date(commission.created_at)
          
          // Check if commission is from today (between today 00:00 and tomorrow 00:00 UTC)
          if (commissionDate >= today && commissionDate < tomorrow) {
            todayEarnings += amount
          } 
          // Check if commission is from yesterday
          else if (commissionDate >= yesterday && commissionDate < today) {
            yesterdayEarnings += amount
          }
          
          // Calculate level-specific earnings
          if (commission.level === 1) {
            level1Earnings += amount
          } else if (commission.level === 2) {
            level2Earnings += amount
          } else if (commission.level === 3) {
            level3Earnings += amount
          }
        })
      }
      
      setStats({
        level1Count,
        level2Count,
        level3Count,
        totalEarnings,
        todayEarnings,
        yesterdayEarnings,
        level1Earnings,
        level2Earnings,
        level3Earnings
      })

      // Fetch detailed referral history
      await fetchReferralHistory(userId, level1Data || [])

    } catch (error) {
      console.error('Error fetching referral stats:', error)
      // Set default values on error
      setStats({
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        totalEarnings: 0,
        todayEarnings: 0,
        yesterdayEarnings: 0,
        level1Earnings: 0,
        level2Earnings: 0,
        level3Earnings: 0
      })
    }
  }

  const fetchReferralHistory = async (userId: string, level1Users: any[]) => {
    try {
      const allReferrals: ReferralUser[] = []

      // Process Level 1 users
      for (const user of level1Users) {
        const userStats = await getUserStats(user.id)
        allReferrals.push({
          id: user.id,
          full_name: user.full_name,
          email: user.email || `${user.full_name.toLowerCase().replace(' ', '.')}@email.com`,
          referral_code: user.referral_code,
          created_at: user.created_at,
          level: 1,
          totalDeposits: userStats.totalDeposits,
          totalWithdrawals: userStats.totalWithdrawals,
          totalEarnings: userStats.totalEarnings,
          isActive: userStats.activePlans > 0
        })
      }

      // Get Level 2 users
      if (level1Users.length > 0) {
        const level1UserIds = level1Users.map(u => u.id)
        const { data: level2Users } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, referral_code, created_at, referred_by')
          .in('referred_by', level1UserIds)

        if (level2Users) {
          for (const user of level2Users) {
            const userStats = await getUserStats(user.id)
            allReferrals.push({
              id: user.id,
              full_name: user.full_name,
              email: user.email || `${user.full_name.toLowerCase().replace(' ', '.')}@email.com`,
              referral_code: user.referral_code,
              created_at: user.created_at,
              level: 2,
              totalDeposits: userStats.totalDeposits,
              totalWithdrawals: userStats.totalWithdrawals,
              totalEarnings: userStats.totalEarnings,
              isActive: userStats.activePlans > 0
            })
          }

          // Get Level 3 users
          const level2UserIds = level2Users.map(u => u.id)
          if (level2UserIds.length > 0) {
            const { data: level3Users } = await supabase
              .from('user_profiles')
              .select('id, full_name, email, referral_code, created_at, referred_by')
              .in('referred_by', level2UserIds)

            if (level3Users) {
              for (const user of level3Users) {
                const userStats = await getUserStats(user.id)
                allReferrals.push({
                  id: user.id,
                  full_name: user.full_name,
                  email: user.email || `${user.full_name.toLowerCase().replace(' ', '.')}@email.com`,
                  referral_code: user.referral_code,
                  created_at: user.created_at,
                  level: 3,
                  totalDeposits: userStats.totalDeposits,
                  totalWithdrawals: userStats.totalWithdrawals,
                  totalEarnings: userStats.totalEarnings,
                  isActive: userStats.activePlans > 0
                })
              }
            }
          }
        }
      }

      setReferralHistory(allReferrals)
    } catch (error) {
      console.error('Error fetching referral history:', error)
    }
  }

  const getUserStats = async (userId: string) => {
    try {
      // Get total deposits - try different status values
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount_pkr, status')
        .eq('user_id', userId)
      
      const totalDeposits = deposits?.reduce((sum, d) => {
        // Include completed, approved, and successful deposits
        if (['Completed', 'completed', 'Approved', 'approved', 'Success', 'success'].includes(d.status)) {
          return sum + d.amount_pkr
        }
        return sum
      }, 0) || 0

      // Get total withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .eq('user_id', userId)

      const totalWithdrawals = withdrawals?.reduce((sum, w) => {
        if (['Completed', 'completed', 'Approved', 'approved', 'Success', 'success'].includes(w.status)) {
          return sum + w.amount
        }
        return sum
      }, 0) || 0

      // Get total investments and active plans from 'investments' table
      const { data: investmentsData, error: investmentsDataError } = await supabase
        .from('investments')
        .select('amount_invested, status')
        .eq('user_id', userId)
      
      let totalInvestments = 0
      let activePlans = 0
      
      if (!investmentsDataError && investmentsData && investmentsData.length > 0) {
        // Use the correct column name: amount_invested
        totalInvestments = investmentsData.reduce((sum, inv) => sum + (inv.amount_invested || 0), 0)
        
        // Count active plans
        activePlans = investmentsData.filter(inv => 
          ['Active', 'active', 'Running', 'running', 'Approved', 'approved'].includes(inv.status)
        ).length
      }

      // For now, set totalEarnings to 0 since daily_income table doesn't exist
      // This can be calculated from other sources later
      const totalEarnings = 0

      return {
        totalDeposits,
        totalWithdrawals,
        totalInvestments,
        totalEarnings,
        activePlans
      }

    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalInvestments: 0,
        totalEarnings: 0,
        activePlans: 0
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLevelBadge = (level: number) => {
    const badges = {
      1: { color: 'bg-blue-100 text-blue-800', text: 'Level 1' },
      2: { color: 'bg-green-100 text-green-800', text: 'Level 2' },
      3: { color: 'bg-purple-100 text-purple-800', text: 'Level 3' }
    }
    return badges[level as keyof typeof badges] || badges[1]
  }

  const filteredReferrals = referralHistory.filter(referral => {
    const matchesSearch = referral.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === 'all' || referral.level === levelFilter
    return matchesSearch && matchesLevel
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-white/60 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/60 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-white/60 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 font-['Inter',_sans-serif]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 md:mb-3">
            My Referral Dashboard
          </h1>
          <p className="text-gray-600 text-base md:text-lg">Track your referral performance and earnings</p>
        </div>

        {/* Referral Link Card - Moved to top */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl md:rounded-2xl p-4 md:p-8 text-white">
          <div className="flex items-center mb-4 md:mb-6">
            <Gift className="w-6 h-6 md:w-8 md:h-8 mr-3 md:mr-4" />
            <h2 className="text-lg md:text-2xl font-bold">Your Referral Link</h2>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-white/30">
            <p className="text-xs md:text-sm font-mono break-all text-white/90 font-medium">{getReferralLink()}</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-white/30 transition-all duration-200 flex-1 font-medium border border-white/30"
            >
              {copied ? <Check size={16} className="md:w-[18px] md:h-[18px]" /> : <Copy size={16} className="md:w-[18px] md:h-[18px]" />}
              <span className="text-sm md:text-base">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={shareReferralLink}
              className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-white/30 transition-all duration-200 flex-1 font-medium border border-white/30"
            >
              <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="text-sm md:text-base">Share</span>
            </button>
          </div>
        </div>

        {/* Commission Rates Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-8">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg md:rounded-xl mr-3 md:mr-4">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">Commission Rates</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {/* Level 1 Rate */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl p-4 md:p-6 text-white text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span className="text-xl md:text-2xl font-bold">L1</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-2">
                {settings ? `${settings.referral_l1_percent}%` : '5%'}
              </div>
              <div className="text-blue-100 font-medium text-sm md:text-base">Direct Referrals</div>
              <div className="mt-1 md:mt-2 text-blue-200 text-xs md:text-sm">When your referral invests</div>
            </div>
            
            {/* Level 2 Rate */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg md:rounded-xl p-4 md:p-6 text-white text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span className="text-xl md:text-2xl font-bold">L2</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-2">
                {settings ? `${settings.referral_l2_percent}%` : '2%'}
              </div>
              <div className="text-green-100 font-medium text-sm md:text-base">2nd Level</div>
              <div className="mt-1 md:mt-2 text-green-200 text-xs md:text-sm">When L1 referral invests</div>
            </div>
            
            {/* Level 3 Rate */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl p-4 md:p-6 text-white text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span className="text-xl md:text-2xl font-bold">L3</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-2">
                {settings ? `${settings.referral_l3_percent}%` : '1%'}
              </div>
              <div className="text-purple-100 font-medium text-sm md:text-base">3rd Level</div>
              <div className="mt-1 md:mt-2 text-purple-200 text-xs md:text-sm">When L2 referral invests</div>
            </div>
          </div>

          {/* How it Works Section */}
          <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg md:rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
              <Star className="w-5 h-5 text-amber-500 mr-2" />
              How Referral Commissions Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-sm md:text-base">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Share Your Link</p>
                  <p className="text-gray-600 text-xs md:text-sm">Send your referral link to friends</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">They Invest</p>
                  <p className="text-gray-600 text-xs md:text-sm">When they make a deposit</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Earn Commission</p>
                  <p className="text-gray-600 text-xs md:text-sm">Get instant commission</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Program Summary Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-8">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg md:rounded-xl mr-3 md:mr-4">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">Referral Program</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg md:rounded-xl p-4 md:p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 text-sm md:text-base">Today Commission</span>
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-green-200" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.todayEarnings)}</div>
              <div className="text-green-200 text-xs md:text-sm mt-1">Real-time data</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg md:rounded-xl p-4 md:p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm md:text-base">Yesterday Commission</span>
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-blue-200" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">{formatCurrency(stats.yesterdayEarnings)}</div>
              <div className="text-blue-200 text-xs md:text-sm mt-1">Previous day</div>
            </div>
          </div>
        </div>

        {/* Commission Earnings Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-8">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:rounded-xl mr-3 md:mr-4">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">Level Commissions</h2>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg md:rounded-xl border border-blue-200">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                  <span className="text-white font-bold text-sm md:text-base">L1</span>
                </div>
                <div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">Level 1</span>
                  {settings && (
                    <div className="text-blue-500 text-xs md:text-sm font-medium">{settings.referral_l1_percent}% commission</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg md:text-2xl font-bold text-blue-600">{formatCurrency(stats.level1Earnings)}</div>
                <div className="text-blue-500 text-xs md:text-sm">Direct referrals</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg md:rounded-xl border border-green-200">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                  <span className="text-white font-bold text-sm md:text-base">L2</span>
                </div>
                <div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">Level 2</span>
                  {settings && (
                    <div className="text-green-500 text-xs md:text-sm font-medium">{settings.referral_l2_percent}% commission</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg md:text-2xl font-bold text-green-600">{formatCurrency(stats.level2Earnings)}</div>
                <div className="text-green-500 text-xs md:text-sm">2nd level referrals</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg md:rounded-xl border border-purple-200">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3 md:mr-4">
                  <span className="text-white font-bold text-sm md:text-base">L3</span>
                </div>
                <div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">Level 3</span>
                  {settings && (
                    <div className="text-purple-500 text-xs md:text-sm font-medium">{settings.referral_l3_percent}% commission</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg md:text-2xl font-bold text-purple-600">{formatCurrency(stats.level3Earnings)}</div>
                <div className="text-purple-500 text-xs md:text-sm">3rd level referrals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Referrals Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-8">
          <div className="flex items-center mb-4 md:mb-6">
            <div className="p-2 md:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg md:rounded-xl mr-3 md:mr-4">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">Active Referrals</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl p-4 md:p-6 text-white text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stats.level1Count}</div>
              <div className="text-blue-100 font-medium text-sm md:text-base">L1 Active</div>
              <div className="mt-1 md:mt-2 text-blue-200 text-xs md:text-sm">Direct referrals</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg md:rounded-xl p-4 md:p-6 text-white text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stats.level2Count.toString().padStart(2, '0')}</div>
              <div className="text-green-100 font-medium text-sm md:text-base">L2 Active</div>
              <div className="mt-1 md:mt-2 text-green-200 text-xs md:text-sm">2nd level referrals</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg md:rounded-xl p-4 md:p-6 text-white text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stats.level3Count.toString().padStart(2, '0')}</div>
              <div className="text-purple-100 font-medium text-sm md:text-base">L3 Active</div>
              <div className="mt-1 md:mt-2 text-purple-200 text-xs md:text-sm">3rd level referrals</div>
            </div>
          </div>
        </div>

        {/* Referral Tree Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center">
              <div className="p-2 md:p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg md:rounded-xl mr-3 md:mr-4">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-800">Referral Tree</h2>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              <div className="relative filter-dropdown">
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center justify-center space-x-2 px-3 md:px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {levelFilter === 'all' ? 'All Levels' : `Level ${levelFilter}`}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setLevelFilter('all')
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          levelFilter === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        All Levels ({referralHistory.length})
                      </button>
                      <button
                        onClick={() => {
                          setLevelFilter(1)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          levelFilter === 1 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        Level 1 ({stats.level1Count})
                      </button>
                      <button
                        onClick={() => {
                          setLevelFilter(2)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          levelFilter === 2 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        Level 2 ({stats.level2Count})
                      </button>
                      <button
                        onClick={() => {
                          setLevelFilter(3)
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          levelFilter === 3 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        Level 3 ({stats.level3Count})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Level</th>
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm min-w-[150px]">User Email</th>
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Earning</th>
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Deposit</th>
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Withdrawals</th>
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Join Date</th>
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-700 text-xs md:text-sm">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.map((referral, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white/30'
                      }`}
                    >
                      <td className="py-3 md:py-4 px-2 md:px-4">
                        <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                          referral.level === 1 ? 'bg-blue-100 text-blue-800' :
                          referral.level === 2 ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          L{referral.level}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-700 text-xs md:text-sm">
                        <div className="truncate max-w-[120px] md:max-w-none" title={referral.email}>
                          {referral.email}
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-800 text-xs md:text-sm">
                        <div className="whitespace-nowrap">{formatCurrency(referral.totalEarnings)}</div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-800 text-xs md:text-sm">
                        <div className="whitespace-nowrap">{formatCurrency(referral.totalDeposits)}</div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 font-semibold text-gray-800 text-xs md:text-sm">
                        <div className="whitespace-nowrap">{formatCurrency(referral.totalWithdrawals)}</div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-gray-600 text-xs md:text-sm">
                        <div className="whitespace-nowrap">{formatDate(referral.created_at)}</div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4">
                        <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                          referral.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {referral.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {filteredReferrals.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

