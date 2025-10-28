'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '@/lib/auth'
import { Home, TrendingUp, Wallet, User, Users, LogOut } from 'lucide-react'
import WhatsAppSupport from '@/components/WhatsAppSupport'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getCurrentUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)
      // Force update to ensure navigation renders correctly
      setForceUpdate(prev => prev + 1)
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Navigation items with referral program and profile
  const navItems = React.useMemo(() => [
    { 
      href: '/dashboard', 
      icon: Home, 
      label: 'Home' 
    },
    { 
      href: '/dashboard/my-investments', 
      icon: TrendingUp, 
      label: 'Active Plan' 
    },
    { 
      href: '/dashboard/invite', 
      icon: Users, 
      label: 'Referral Program'  // Referral program page
    },
    { 
      href: '/dashboard/profile', 
      icon: User, 
      label: 'Profile'    // Profile page
    }
  ], [])

  console.log('Navigation items (render #' + forceUpdate + '):', navItems)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #101320 0%, #1a1d35 100%)' }}>
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-green-500 mx-auto" style={{ borderColor: '#2e335d', borderTopColor: '#22c55e' }}></div>
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}></div>
          </div>
          <p className="mt-4 animate-pulse" style={{ color: '#6b7299' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Modern Top Bar */}
      <header className="bg-blue-900 border-b-2 border-blue-400 sticky top-0 z-40" style={{boxShadow: '0 2px 20px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'}}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                SmartGrow Mining
              </h1>
              <p className="text-xs text-slate-400">Cryptocurrency Mining Investment Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Modern Bottom Navigation - Updated */}
      <nav className="fixed bottom-0 left-0 right-0 bg-blue-900 border-t-2 border-blue-400 z-50" style={{boxShadow: '0 -2px 20px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'}}>
        <div className="grid grid-cols-4 h-16">
          {navItems.map(({ href, icon: Icon, label }, index) => {
            const isActive = pathname === href
            return (
              <Link
                key={`${href}-${index}-${forceUpdate}`}
                href={href}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label} {/* Updated */}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout Button (Hidden, can be accessed from profile) */}
      <button
        onClick={handleSignOut}
        className="hidden"
        id="logout-button"
      >
        <LogOut size={16} />
        Sign Out
      </button>

      {/* Floating WhatsApp Support */}
      <WhatsAppSupport variant="floating" />
    </div>
  )
}
