'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import ErrorBoundary from '@/components/ErrorBoundary'

// Dynamic imports for better performance
const WhatsAppSupport = dynamic(() => import('@/components/WhatsAppSupport'), {
  ssr: false,
  loading: () => null
})
const AppInstallPrompt = dynamic(() => import('@/components/AppInstallPrompt'), {
  ssr: false,
  loading: () => null
})
const ModernHeader = dynamic(() => import('@/components/ModernHeader'), {
  ssr: false,
  loading: () => <div className="h-16 bg-slate-900/50" />
})
const ModernNavigation = dynamic(() => import('@/components/ModernNavigation'), {
  ssr: false,
  loading: () => <div className="h-16 bg-slate-900/50" />
})


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
