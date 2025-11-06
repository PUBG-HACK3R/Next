'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  TrendingUp, 
  Users, 
  User, 
  Wallet,
  PlusCircle,
  History,
  Settings,
  Crown
} from 'lucide-react'

interface NavigationItem {
  href: string
  icon: any
  label: string
  badge?: number
  isNew?: boolean
}

interface ModernNavigationProps {
  variant?: 'bottom' | 'sidebar'
  isAdmin?: boolean
}

export default function ModernNavigation({ variant = 'bottom', isAdmin = false }: ModernNavigationProps) {
  const pathname = usePathname()
  const [activeIndex, setActiveIndex] = useState(0)

  const navItems: NavigationItem[] = [
    { 
      href: '/dashboard', 
      icon: Home, 
      label: 'Home' 
    },
    { 
      href: '/dashboard/my-investments', 
      icon: TrendingUp, 
      label: 'Investments'
    },
    { 
      href: '/dashboard/invite', 
      icon: Users, 
      label: 'Referrals',
      isNew: true
    },
    { 
      href: '/dashboard/profile', 
      icon: User, 
      label: 'Profile'
    }
  ]

  const adminNavItems: NavigationItem[] = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/deposits', icon: PlusCircle, label: 'Deposits' },
    { href: '/admin/withdrawals', icon: Wallet, label: 'Withdrawals' },
    { href: '/admin/rankings', icon: Crown, label: 'Rankings' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' }
  ]

  const items = isAdmin ? adminNavItems : navItems

  useEffect(() => {
    const currentIndex = items.findIndex(item => item.href === pathname)
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex)
    }
  }, [pathname, items])

  if (variant === 'bottom') {
    return (
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl rounded-t-2xl"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-gradient-x rounded-t-2xl"></div>
        
        {/* Active indicator background */}
        <motion.div
          className="absolute top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={false}
          animate={{
            left: `${(activeIndex / items.length) * 100}%`,
            width: `${100 / items.length}%`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <div className="relative px-2 py-1">
          <div className={`grid grid-cols-${items.length} gap-1`}>
            {items.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {/* Icon container with glow effect */}
                    <div className="relative">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`p-1.5 rounded-lg ${
                          isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                            : 'bg-white/10'
                        }`}
                      >
                        <Icon 
                          size={18} 
                          className={`${
                            isActive ? 'text-white' : 'text-slate-400'
                          } transition-colors duration-200`} 
                        />
                      </motion.div>

                      {/* Badge */}
                      {item.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white"
                        >
                          <span className="text-xs font-bold text-white">{item.badge}</span>
                        </motion.div>
                      )}

                      {/* New indicator */}
                      {item.isNew && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white"
                        />
                      )}
                    </div>

                    {/* Label */}
                    <motion.span
                      animate={isActive ? { y: 0, opacity: 1 } : { y: 2, opacity: 0.7 }}
                      className={`text-xs font-medium mt-1 transition-all duration-200 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Bottom safe area for iOS */}
        <div className="h-safe-bottom bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95"></div>
      </motion.nav>
    )
  }

  // Sidebar variant for admin panel
  return (
    <motion.nav
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-56 bg-gradient-to-b from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xs text-slate-400">Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-3 space-y-1">
        {items.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center space-x-2 p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg'
                    : 'hover:bg-white/10'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full"
                  />
                )}

                <div className={`p-1.5 rounded-lg ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
                    : 'bg-white/10'
                }`}>
                  <Icon 
                    size={18} 
                    className={`${
                      isActive ? 'text-white' : 'text-slate-400'
                    } transition-colors duration-200`} 
                  />
                </div>

                <span className={`font-medium transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">{item.badge}</span>
                  </motion.div>
                )}

                {/* New indicator */}
                {item.isNew && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="ml-auto w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
