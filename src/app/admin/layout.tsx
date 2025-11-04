'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import { 
  LayoutDashboard, 
  CreditCard, 
  Banknote, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut,
  Menu,
  X,
  Trophy
} from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'
import ModernHeader from '@/components/ModernHeader'
import ModernNavigation from '@/components/ModernNavigation'
import './admin-dark.css'

interface UserProfile {
  id: string
  full_name: string
  user_level: number
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getCurrentUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await getUserProfile(user.id)
      if (!profileData || profileData.user_level < 999) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setProfile(profileData)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/deposits', icon: CreditCard, label: 'Manage Deposits' },
    { href: '/admin/withdrawals', icon: Banknote, label: 'Manage Withdrawals' },
    { href: '/admin/users', icon: Users, label: 'Manage Users' },
    { href: '/admin/plans', icon: TrendingUp, label: 'Manage Plans' },
    { href: '/admin/rankings', icon: Trophy, label: 'User Rankings' },
    { href: '/admin/settings', icon: Settings, label: 'Site Settings' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-blue-400 mx-auto"></div>
          <p className="mt-4 text-white">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Modern Header for Mobile */}
      <div className="lg:hidden">
        <ModernHeader 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={true}
          title="Admin Panel"
          subtitle="Management Dashboard"
        />
      </div>

      <div className="flex">
        {/* Modern Sidebar Navigation */}
        <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <ModernNavigation variant="sidebar" isAdmin={true} />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <ModernHeader 
              title="Admin Panel"
              subtitle="Management Dashboard"
            />
          </div>

          {/* Page Content */}
          <main className="p-6 bg-slate-900/50 min-h-screen">
            {children}
          </main>
        </div>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>

      {/* Floating WhatsApp Support for Admin */}
      <WhatsAppSupport variant="floating" />
    </div>
  )
}
