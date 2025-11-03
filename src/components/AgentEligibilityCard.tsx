'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Crown, 
  Users, 
  CheckCircle, 
  Clock, 
  Star, 
  MessageCircle,
  ArrowRight,
  Target
} from 'lucide-react'

interface AgentEligibility {
  level1_active_count: number
  level2_active_count: number
  level3_active_count: number
  eligibility_achieved: boolean
  eligibility_achieved_at: string | null
}

interface AgentSettings {
  agent_l1_requirement: number
  agent_l2_requirement: number
  agent_l3_requirement: number
  whatsapp_support_number: string
}

interface UserProfile {
  is_agent: boolean
  agent_status: string
}

interface AgentEligibilityCardProps {
  userId: string
  compact?: boolean
  showFullDetails?: boolean
}

export default function AgentEligibilityCard({ 
  userId, 
  compact = false, 
  showFullDetails = false 
}: AgentEligibilityCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [eligibility, setEligibility] = useState<AgentEligibility | null>(null)
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('is_agent, agent_status')
          .eq('id', userId)
          .single()

        if (profileData) {
          setProfile(profileData)
        }

        // Fetch agent eligibility tracking
        const { data: eligibilityData } = await supabase
          .from('agent_eligibility_tracking')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (eligibilityData) {
          setEligibility(eligibilityData)
        } else {
          // If no tracking record exists, create one by calling the update function
          await supabase.rpc('update_agent_eligibility', { user_id: userId })
          
          // Fetch again after creating
          const { data: newEligibilityData } = await supabase
            .from('agent_eligibility_tracking')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          if (newEligibilityData) {
            setEligibility(newEligibilityData)
          }
        }

        // Fetch agent settings
        const { data: settingsData } = await supabase
          .from('admin_settings')
          .select('agent_l1_requirement, agent_l2_requirement, agent_l3_requirement, whatsapp_support_number')
          .eq('id', 1)
          .single()

        if (settingsData) {
          setSettings(settingsData)
        }
      } catch (error) {
        console.error('Error fetching agent data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const handleContactSupport = () => {
    const supportNumber = settings?.whatsapp_support_number || '1234567890'
    const message = encodeURIComponent('Hi, I would like to activate my agent program. I have met all the requirements.')
    window.open(`https://wa.me/${supportNumber}?text=${message}`, '_blank')
  }

  const getProgressPercentage = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100)
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-white/20 rounded w-1/2"></div>
      </div>
    )
  }

  if (!eligibility || !settings) {
    return null
  }

  const isEligible = eligibility.eligibility_achieved
  const isAgent = profile?.is_agent || false

  // Compact version for profile page
  if (compact) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isAgent ? 'bg-green-500' : isEligible ? 'bg-yellow-500' : 'bg-gray-500'}`}>
              {isAgent ? <CheckCircle className="w-5 h-5 text-white" /> : 
               isEligible ? <Star className="w-5 h-5 text-white" /> : 
               <Clock className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {isAgent ? 'Active Agent' : isEligible ? 'Agent Eligible' : 'Agent Program'}
              </h3>
              <p className="text-sm text-slate-400">
                {isAgent ? 'Earning commissions' : 
                 isEligible ? 'Contact support to activate' : 
                 `${eligibility.level1_active_count}/${settings.agent_l1_requirement} L1 members`}
              </p>
            </div>
          </div>
          
          {isEligible && !isAgent && (
            <button
              onClick={handleContactSupport}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Activate
            </button>
          )}
        </div>
      </div>
    )
  }

  // Full version for referral program page
  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Agent Program</h3>
            <p className="text-purple-200 text-sm">
              {isAgent ? 'You are an active agent' : 
               isEligible ? 'You are eligible to become an agent' : 
               'Build your team to become eligible'}
            </p>
          </div>
        </div>
        
        {isEligible && !isAgent && (
          <button
            onClick={handleContactSupport}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Activate</span>
          </button>
        )}
      </div>

      {showFullDetails && !isAgent && (
        <div className="space-y-3">
          {/* Level 1 Progress */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Level 1 Active</span>
              <span className="text-purple-300 font-bold text-sm">
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
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Level 2 Active</span>
              <span className="text-purple-300 font-bold text-sm">
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
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Level 3 Active</span>
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
      )}

      {isAgent && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mt-4">
          <div className="flex items-center space-x-2 text-green-300">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold text-sm">Active Agent - Earning 2% commission from all levels</span>
          </div>
        </div>
      )}

      {!isAgent && (
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '/dashboard/agent-program'}
            className="w-full bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>View Agent Program Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
