'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  Trophy, 
  Users, 
  DollarSign, 
  Target, 
  CheckCircle, 
  Clock,
  Star,
  Gift,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  Crown,
  Zap,
  Award
} from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string
  is_agent: boolean
  agent_status: string
  agent_activated_at: string | null
}

interface AgentEligibility {
  level1_active_count: number
  level2_active_count: number
  level3_active_count: number
  eligibility_achieved: boolean
  eligibility_achieved_at: string | null
}

interface AgentSettings {
  agent_initial_bonus: number
  agent_weekly_salary: number
  agent_commission_percent: number
  agent_l1_requirement: number
  agent_l2_requirement: number
  agent_l3_requirement: number
  agent_salary_l1_requirement: number
  agent_salary_l2_requirement: number
  agent_salary_l3_requirement: number
  whatsapp_support_number: string
}

export default function AgentProgramPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<AgentEligibility | null>(null)
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [loading, setLoading] = useState(true)
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
        .select('id, full_name, is_agent, agent_status, agent_activated_at')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch agent eligibility tracking
      const { data: eligibilityData } = await supabase
        .from('agent_eligibility_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (eligibilityData) {
        setEligibility(eligibilityData)
      } else {
        // If no tracking record exists, create one by calling the update function
        await supabase.rpc('update_agent_eligibility', { user_id: user.id })
        
        // Fetch again after creating
        const { data: newEligibilityData } = await supabase
          .from('agent_eligibility_tracking')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (newEligibilityData) {
          setEligibility(newEligibilityData)
        }
      }

      // Fetch agent settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select(`
          agent_initial_bonus, agent_weekly_salary, agent_commission_percent,
          agent_l1_requirement, agent_l2_requirement, agent_l3_requirement,
          agent_salary_l1_requirement, agent_salary_l2_requirement, agent_salary_l3_requirement,
          whatsapp_support_number
        `)
        .eq('id', 1)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleActivateAgent = async () => {
    if (!eligibility?.eligibility_achieved) return

    try {
      const { data, error } = await supabase.rpc('activate_agent', { 
        user_id: user.id 
      })

      if (error) throw error

      if (data) {
        // Refresh profile data
        const { data: updatedProfile } = await supabase
          .from('user_profiles')
          .select('id, full_name, is_agent, agent_status, agent_activated_at')
          .eq('id', user.id)
          .single()

        if (updatedProfile) {
          setProfile(updatedProfile)
        }
      }
    } catch (error) {
      console.error('Error activating agent:', error)
    }
  }

  const handleContactSupport = () => {
    const supportNumber = settings?.whatsapp_support_number || '1234567890'
    const message = encodeURIComponent('Hi, I would like to activate my agent program. I have met all the requirements.')
    window.open(`https://wa.me/${supportNumber}?text=${message}`, '_blank')
  }

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  const isEligible = eligibility?.eligibility_achieved || false
  const isAgent = profile?.is_agent || false

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="p-4 space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Program</h1>
          <p className="text-blue-100">Become an agent and unlock exclusive benefits</p>
        </div>

        {/* Agent Status Card - Compact */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isAgent ? 'bg-green-500' : isEligible ? 'bg-yellow-500' : 'bg-gray-500'}`}>
                {isAgent ? <CheckCircle className="w-5 h-5 text-white" /> : 
                 isEligible ? <Star className="w-5 h-5 text-white" /> : 
                 <Clock className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isAgent ? 'Active Agent' : isEligible ? 'Eligible for Agent Program' : 'Agent Program Progress'}
                </h2>
                <p className="text-blue-100 text-xs">
                  {isAgent ? 'You are an active agent earning commissions' : 
                   isEligible ? 'You can now activate your agent status' : 
                   'Complete the requirements to become eligible'}
                </p>
              </div>
            </div>
            
            {isEligible && !isAgent && (
              <button
                onClick={handleContactSupport}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center space-x-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact</span>
              </button>
            )}
          </div>

          {isAgent && profile?.agent_activated_at && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mt-3">
              <div className="flex items-center space-x-2 text-green-300">
                <Award className="w-4 h-4" />
                <span className="font-semibold text-sm">Agent since {new Date(profile.agent_activated_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Requirements Progress - Compact */}
        {!isAgent && settings && eligibility && (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-blue-400 mr-3" />
              <h2 className="text-lg font-bold text-white">Eligibility Requirements</h2>
            </div>

            <div className="space-y-3">
              {/* Level 1 Progress */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">Level 1 Active Members</span>
                  <span className="text-blue-300 font-bold text-sm">
                    {eligibility.level1_active_count} / {settings.agent_l1_requirement}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(eligibility.level1_active_count, settings.agent_l1_requirement)}%` }}
                  ></div>
                </div>
              </div>

              {/* Level 2 Progress */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">Level 2 Active Members</span>
                  <span className="text-green-300 font-bold text-sm">
                    {eligibility.level2_active_count} / {settings.agent_l2_requirement}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(eligibility.level2_active_count, settings.agent_l2_requirement)}%` }}
                  ></div>
                </div>
              </div>

              {/* Level 3 Progress */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">Level 3 Active Members</span>
                  <span className="text-purple-300 font-bold text-sm">
                    {eligibility.level3_active_count} / {settings.agent_l3_requirement}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(eligibility.level3_active_count, settings.agent_l3_requirement)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Benefits - Compact */}
        {settings && (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center mb-4">
              <Gift className="w-5 h-5 text-yellow-400 mr-3" />
              <h2 className="text-lg font-bold text-white">Agent Benefits</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Initial Bonus */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Initial Bonus</h3>
                    <p className="text-yellow-200 text-xs">One-time activation reward</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-yellow-300">
                  {formatCurrency(settings.agent_initial_bonus)}
                </div>
                <p className="text-yellow-200 text-xs mt-1">Paid directly to your bank account</p>
              </div>

              {/* Weekly Salary */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-green-500 rounded-lg mr-3">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Weekly Salary</h3>
                    <p className="text-green-200 text-xs">Recurring weekly payment</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-300">
                  {formatCurrency(settings.agent_weekly_salary)}
                </div>
                <p className="text-green-200 text-xs mt-1">
                  Requires {settings.agent_salary_l1_requirement}L1, {settings.agent_salary_l2_requirement}L2, {settings.agent_salary_l3_requirement}L3 active members
                </p>
              </div>

              {/* Commission Rate */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-purple-500 rounded-lg mr-3">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Commission Rate</h3>
                    <p className="text-purple-200 text-xs">From all team members</p>
                  </div>
                </div>
                <div className="text-xl font-bold text-purple-300">
                  {settings.agent_commission_percent}%
                </div>
                <p className="text-purple-200 text-xs mt-1">From all levels under you</p>
              </div>

              {/* Team Building */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-blue-500 rounded-lg mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Team Building</h3>
                    <p className="text-blue-200 text-xs">Long-term platform benefits</p>
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-300 mb-1">
                  Exclusive Support
                </div>
                <p className="text-blue-200 text-xs">Priority customer service and team management tools</p>
              </div>
            </div>
          </div>
        )}

        {/* How to Become an Agent - Compact */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
          <div className="flex items-center mb-4">
            <Trophy className="w-5 h-5 text-orange-400 mr-3" />
            <h2 className="text-lg font-bold text-white">How to Become an Agent</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">Build Your Team</h3>
                <p className="text-blue-100 text-xs">
                  Get {settings?.agent_l1_requirement} active members on Level 1, {settings?.agent_l2_requirement} on Level 2, and {settings?.agent_l3_requirement} on Level 3
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">Ensure Active Members</h3>
                <p className="text-blue-100 text-xs">
                  "Active" means users who have made deposits and purchased investment plans
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                3
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">Contact Support</h3>
                <p className="text-blue-100 text-xs">
                  Once eligible, contact customer support to activate your agent status
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                4
              </div>
              <div>
                <h3 className="text-white font-medium text-sm mb-1">Start Earning</h3>
                <p className="text-blue-100 text-xs">
                  Receive your initial bonus and start earning weekly salary + commissions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action - Compact */}
        {!isAgent && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-center">
            <h2 className="text-lg font-bold text-white mb-2">Ready to Become an Agent?</h2>
            <p className="text-indigo-100 mb-4 text-sm">
              {isEligible 
                ? 'You meet all requirements! Contact support to activate your agent status.'
                : 'Keep building your team to unlock the agent program benefits.'}
            </p>
            
            {isEligible ? (
              <button
                onClick={handleContactSupport}
                className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 mx-auto text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Support to Activate</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/dashboard/invite')}
                className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 mx-auto text-sm"
              >
                <Users className="w-4 h-4" />
                <span>Build Your Team</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
