'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  Mail, 
  ChevronRight,
  LinkIcon,
  History,
  Download,
  Upload,
  Info,
  MessageCircle,
  Share2,
  LogOut,
  Crown
} from 'lucide-react'
import AgentEligibilityCard from '@/components/AgentEligibilityCard'

interface UserProfile {
  id: string
  full_name: string
  email: string
  balance: number
  user_level: number
}

interface AdminSettings {
  whatsapp_support_number: string
  whatsapp_group_link: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<AdminSettings | null>(null)
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
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch admin settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('whatsapp_support_number, whatsapp_group_link')
        .eq('id', 1)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleCustomerSupport = () => {
    const supportNumber = settings?.whatsapp_support_number || '1234567890'
    window.open(`https://wa.me/${supportNumber}`, '_blank')
  }

  const handleSocialMedia = () => {
    const groupLink = settings?.whatsapp_group_link || 'https://chat.whatsapp.com/default'
    window.open(groupLink, '_blank')
  }

  const menuItems = [
    {
      icon: Crown,
      title: 'Agent Program',
      href: '/dashboard/agent-program',
      description: 'Become an agent and earn exclusive rewards'
    },
    {
      icon: LinkIcon,
      title: 'Bind Account',
      href: '/dashboard/profile/bind-account',
      description: 'Link your payment accounts'
    },
    {
      icon: Share2,
      title: 'Referral Program',
      href: '/dashboard/invite',
      description: 'Invite friends and earn commissions'
    },
    {
      icon: History,
      title: 'Transaction History',
      href: '/dashboard/history',
      description: 'View all your transactions'
    },
    {
      icon: Download,
      title: 'Withdrawal Record',
      href: '/dashboard/profile/withdrawal-record',
      description: 'View withdrawal history'
    },
    {
      icon: Upload,
      title: 'Deposit Record',
      href: '/dashboard/profile/deposit-record',
      description: 'View deposit history'
    },
    {
      icon: Info,
      title: 'About',
      href: '/dashboard/profile/about',
      description: 'Learn more about SmartGrow'
    }
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
      <div className="p-4 space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-2xl p-6 shadow-xl" style={{background: '#009df2'}}>
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold" style={{color: '#009df2'}}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-blue-100 text-sm">
                {profile?.email || user?.email}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                  Level {profile?.user_level || 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Program Status */}
        {user && (
          <AgentEligibilityCard userId={user.id} compact={true} />
        )}

        {/* All Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200 group my-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          ))}

          {/* Customer Service */}
          <button 
            onClick={handleCustomerSupport}
            className="w-full bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200 group my-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Customer Service</h3>
                  <p className="text-sm text-slate-400">Get help via WhatsApp</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Social Media */}
          <button 
            onClick={handleSocialMedia}
            className="w-full bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200 group my-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Social Media</h3>
                  <p className="text-sm text-slate-400">Join our WhatsApp group</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Logout */}
          <button 
            onClick={handleSignOut}
            className="w-full bg-white/10 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-200 group my-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Log Out</h3>
                  <p className="text-sm text-slate-400">Sign out of your account</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
