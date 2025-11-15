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

export default function ModernReferralPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [stats, setStats] = useState<ReferralStats>({
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    totalEarnings: 0,
    todayEarnings: 4000, // Dummy data as requested
    yesterdayEarnings: 1000, // Dummy data
    level1Earnings: 200, // Dummy data
    level2Earnings: 1300, // Dummy data
    level3Earnings: 40 // Dummy data
  })
  const [referralHistory, setReferralHistory] = useState<ReferralUser[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('joinDate')
  const router = useRouter()

  // Dummy referral tree data as requested
  const dummyReferralTree = [
    { level: 1, email: 'john.doe@email.com', earning: 1200, deposit: 5000, withdrawals: 800, joinDate: '2024-01-15', isActive: true },
    { level: 1, email: 'jane.smith@email.com', earning: 950, deposit: 3500, withdrawals: 400, joinDate: '2024-02-20', isActive: true },
    { level: 2, email: 'mike.wilson@email.com', earning: 750, deposit: 2800, withdrawals: 200, joinDate: '2024-03-10', isActive: false },
    { level: 2, email: 'sarah.brown@email.com', earning: 1100, deposit: 4200, withdrawals: 600, joinDate: '2024-02-28', isActive: true },
    { level: 3, email: 'alex.johnson@email.com', earning: 320, deposit: 1500, withdrawals: 100, joinDate: '2024-04-05', isActive: true },
    { level: 3, email: 'emma.davis@email.com', earning: 180, deposit: 800, withdrawals: 50, joinDate: '2024-04-12', isActive: false },
  ]

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

      // Set dummy active referral counts as requested
      setStats(prev => ({
        ...prev,
        level1Count: 19, // L1 Active: 19
        level2Count: 9,  // L2 Active: 09
        level3Count: 5   // L3 Active: 05
      }))

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

  const filteredReferrals = dummyReferralTree.filter(referral =>
    referral.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            My Referral Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Track your referral performance and earnings</p>
        </div>

        {/* Referral Program Summary Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Referral Program</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Today's Earnings</span>
                <ArrowUpRight className="w-5 h-5 text-green-200" />
              </div>
              <div className="text-3xl font-bold">{formatCurrency(stats.todayEarnings)}</div>
              <div className="text-green-200 text-sm mt-1">+12.5% from yesterday</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Yesterday's Earnings</span>
                <TrendingUp className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">{formatCurrency(stats.yesterdayEarnings)}</div>
              <div className="text-blue-200 text-sm mt-1">Steady growth</div>
            </div>
          </div>
        </div>

        {/* Commission Earnings Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Level Commissions</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white font-bold">L1</span>
                </div>
                <span className="text-gray-700 font-medium">Level 1</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.level1Earnings)}</div>
                <div className="text-blue-500 text-sm">Direct referrals</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white font-bold">L2</span>
                </div>
                <span className="text-gray-700 font-medium">Level 2</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.level2Earnings)}</div>
                <div className="text-green-500 text-sm">2nd level referrals</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white font-bold">L3</span>
                </div>
                <span className="text-gray-700 font-medium">Level 3</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.level3Earnings)}</div>
                <div className="text-purple-500 text-sm">3rd level referrals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Referrals Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Active Referrals</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">{stats.level1Count}</div>
              <div className="text-blue-100 font-medium">L1 Active</div>
              <div className="mt-2 text-blue-200 text-sm">Direct referrals</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">{stats.level2Count.toString().padStart(2, '0')}</div>
              <div className="text-green-100 font-medium">L2 Active</div>
              <div className="mt-2 text-green-200 text-sm">2nd level referrals</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">{stats.level3Count.toString().padStart(2, '0')}</div>
              <div className="text-purple-100 font-medium">L3 Active</div>
              <div className="mt-2 text-purple-200 text-sm">3rd level referrals</div>
            </div>
          </div>
        </div>

        {/* Referral Tree Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl mr-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Referral Tree</h2>
            </div>
            
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Level</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">User Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Earning</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Deposit</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Withdrawals</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Join Date</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Active</th>
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
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        referral.level === 1 ? 'bg-blue-100 text-blue-800' :
                        referral.level === 2 ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        L{referral.level}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{referral.email}</td>
                    <td className="py-4 px-4 font-semibold text-gray-800">{formatCurrency(referral.earning)}</td>
                    <td className="py-4 px-4 font-semibold text-gray-800">{formatCurrency(referral.deposit)}</td>
                    <td className="py-4 px-4 font-semibold text-gray-800">{formatCurrency(referral.withdrawals)}</td>
                    <td className="py-4 px-4 text-gray-600">{formatDate(referral.joinDate)}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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

        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
          <div className="flex items-center mb-6">
            <Gift className="w-8 h-8 mr-4" />
            <h2 className="text-2xl font-bold">Your Referral Link</h2>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/30">
            <p className="text-sm font-mono break-all text-white/90 font-medium">{getReferralLink()}</p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 flex-1 font-medium border border-white/30"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={shareReferralLink}
              className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-200 flex-1 font-medium border border-white/30"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
