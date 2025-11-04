'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Zap,
  ChevronDown,
  Wallet,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, getCurrentUser, getUserProfile } from '@/lib/auth'

interface ModernHeaderProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
  title?: string
  subtitle?: string
}

export default function ModernHeader({ 
  onMenuToggle, 
  showMenuButton = false, 
  title = "SmartGrow Mining",
  subtitle = "Cryptocurrency Mining Investment Platform"
}: ModernHeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [balance, setBalance] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      const { user } = await getCurrentUser()
      if (user) {
        setUser(user)
        const { data: profileData } = await getUserProfile(user.id)
        if (profileData) {
          setProfile(profileData)
          setBalance(profileData.balance || 0)
        }
      }
    }
    loadUserData()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }


  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-gradient-x"></div>
      
      <div className="relative px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {showMenuButton && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                <Menu size={20} className="text-white" />
              </motion.button>
            )}
            
            {/* Logo and Title */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-500 animate-pulse"></div>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">
                  SmartGrow
                </h1>
                <p className="text-xs text-slate-400">Investment Platform</p>
              </div>
            </motion.div>
          </div>

          {/* Center Section - Spacer */}
          <div className="flex-1"></div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Balance Display */}
            {profile && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-xl border border-green-400/30"
              >
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">
                  ${balance.toLocaleString()}
                </span>
              </motion.div>
            )}


            {/* Profile Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center border border-white/20">
                  <span className="text-sm font-bold text-white">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {profile?.user_level >= 999 ? 'Admin' : 'Member'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center border border-white/20">
                          <span className="text-lg font-bold text-white">
                            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{profile?.full_name || 'User'}</p>
                          <p className="text-sm text-slate-400">{user?.email}</p>
                          {profile?.user_level >= 999 && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Crown className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-yellow-400 font-medium">Administrator</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-white">Profile Settings</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/wallet"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-white">Wallet</span>
                      </Link>

                      {profile?.user_level >= 999 && (
                        <Link
                          href="/admin"
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-white">Admin Panel</span>
                        </Link>
                      )}
                      
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/20 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* Click outside to close dropdowns */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false)
          }}
        />
      )}
    </motion.header>
  )
}
