'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import WhatsAppSupport from '@/components/WhatsAppSupport'
import AppInstallPrompt from '@/components/AppInstallPrompt'
import ModernHeader from '@/components/ModernHeader'
import ModernNavigation from '@/components/ModernNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'


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
  
  // Auto-refresh hook to prevent caching issues
  const { clearCache, softRefresh } = useAutoRefresh({
    enabled: true,
    interval: 30000, // Check every 30 seconds
    maxRetries: 3
  })

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
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Modern Header */}
        <ErrorBoundary>
          <ModernHeader />
        </ErrorBoundary>

        {/* Main Content */}
        <main className="pb-20 pt-2">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        {/* Modern Bottom Navigation */}
        <ErrorBoundary>
          <ModernNavigation variant="bottom" />
        </ErrorBoundary>

        {/* Floating WhatsApp Support */}
        <WhatsAppSupport variant="floating" />

        {/* App Install Prompt */}
        <AppInstallPrompt showOnPages={['dashboard']} />
      </div>
    </ErrorBoundary>
  )
}
