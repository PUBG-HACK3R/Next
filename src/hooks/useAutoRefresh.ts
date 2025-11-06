'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseAutoRefreshOptions {
  enabled?: boolean
  interval?: number
  maxRetries?: number
}

export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const { enabled = true, interval = 30000, maxRetries = 3 } = options
  const router = useRouter()

  const clearCache = useCallback(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('dashboard-cache')
        sessionStorage.clear()
      } catch (error) {
        console.warn('Failed to clear storage:', error)
      }
    }
  }, [])

  const forceRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Clear cache first
      clearCache()
      
      // Force reload without cache
      window.location.reload()
    }
  }, [clearCache])

  const softRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Clear cache and refresh router
      clearCache()
      router.refresh()
    }
  }, [clearCache, router])

  // Auto-refresh mechanism
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let retryCount = 0
    let refreshInterval: NodeJS.Timeout

    const checkAndRefresh = () => {
      // Check if page is stuck or has errors
      const hasErrors = document.querySelector('[data-error="true"]') || 
                       document.body.textContent?.includes('Application error') ||
                       document.body.textContent?.includes('Loading dashboard...') && 
                       performance.now() > 10000 // Loading for more than 10 seconds

      if (hasErrors && retryCount < maxRetries) {
        console.log(`Auto-refresh attempt ${retryCount + 1}/${maxRetries}`)
        retryCount++
        softRefresh()
      }
    }

    // Check periodically
    refreshInterval = setInterval(checkAndRefresh, interval)

    // Check on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAndRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, interval, maxRetries, softRefresh])

  return {
    clearCache,
    forceRefresh,
    softRefresh
  }
}
