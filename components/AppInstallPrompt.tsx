'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface AppInstallPromptProps {
  showOnPages?: ('login' | 'signup' | 'dashboard')[]
}

export default function AppInstallPrompt({ showOnPages = ['login', 'signup', 'dashboard'] }: AppInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [currentPage, setCurrentPage] = useState('')

  useEffect(() => {
    // Detect current page
    const path = window.location.pathname
    if (path.includes('/login')) setCurrentPage('login')
    else if (path.includes('/signup')) setCurrentPage('signup')
    else if (path.includes('/dashboard')) setCurrentPage('dashboard')

    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return
      }
    }

    checkInstalled()

    // Check if we should show the prompt (once per 5 days)
    const checkShouldShow = () => {
      const lastShown = localStorage.getItem('app-install-prompt-last-shown')
      const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000) // 5 days in milliseconds
      
      if (!lastShown || parseInt(lastShown) < fiveDaysAgo) {
        return true
      }
      return false
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Show prompt if conditions are met
      if (!isInstalled && 
          checkShouldShow() && 
          showOnPages.includes(currentPage as any)) {
        setShowPrompt(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Auto-show prompt after 3 seconds if conditions are met
    const timer = setTimeout(() => {
      if (!isInstalled && 
          checkShouldShow() && 
          showOnPages.includes(currentPage as any)) {
        setShowPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timer)
    }
  }, [currentPage, showOnPages, isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support PWA install
      showManualInstallInstructions()
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
      
      // Update last shown timestamp
      localStorage.setItem('app-install-prompt-last-shown', Date.now().toString())
    } catch (error) {
      console.error('Error during app installation:', error)
      showManualInstallInstructions()
    }
  }

  const showManualInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    let instructions = ''
    if (isIOS) {
      instructions = 'Tap the Share button and select "Add to Home Screen"'
    } else if (isAndroid) {
      instructions = 'Tap the menu (⋮) and select "Add to Home screen"'
    } else {
      instructions = 'Look for the install option in your browser menu'
    }
    
    alert(`To install SmartGrow app:\n\n${instructions}`)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Update last shown timestamp to respect the 5-day interval
    localStorage.setItem('app-install-prompt-last-shown', Date.now().toString())
  }

  // Don't show if app is already installed or conditions not met
  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <>
      {/* Mobile Prompt */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 shadow-2xl border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">
                Install SmartGrow App
              </h3>
              
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1 bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Install</span>
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-blue-100 hover:text-white px-2 py-1.5 text-xs transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Prompt */}
      <div className="fixed top-4 right-4 z-50 hidden md:block max-w-sm">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 shadow-2xl border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">
                Install SmartGrow App
              </h3>
              
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center space-x-1 bg-white text-blue-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Install</span>
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-blue-100 hover:text-white px-2 py-1.5 text-xs transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
