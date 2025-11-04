'use client'

import { useEffect, useState, useMemo, memo } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { X, Zap, MessageCircle, ArrowRight, Sparkles, Star, Shield, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAnimationConfig, prefersReducedMotion, isLowEndDevice } from '@/lib/performance'

interface WelcomePopupProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

const WelcomePopup = memo(function WelcomePopup({ isOpen, onClose, userName }: WelcomePopupProps) {
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string | null>(null)
  
  // Performance optimizations
  const animationConfig = useMemo(() => getAnimationConfig(), [])
  const isLowEnd = useMemo(() => isLowEndDevice(), [])
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  useEffect(() => {
    const fetchGroupLink = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('whatsapp_group_link')
          .eq('id', 1)
          .single()

        if (error) throw error

        if (data?.whatsapp_group_link) {
          setWhatsappGroupLink(data.whatsapp_group_link)
        }
      } catch (error) {
        console.error('Error fetching WhatsApp group link:', error)
      }
    }

    if (isOpen) {
      fetchGroupLink()
    }
  }, [isOpen])

  const handleJoinGroup = () => {
    if (whatsappGroupLink) {
      window.open(whatsappGroupLink, '_blank')
    }
  }

  const handleActivateMiner = () => {
    onClose()
  }

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Enhanced Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animationConfig.duration }}
              className={`absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/60 to-purple-900/80 ${isLowEnd ? '' : 'backdrop-blur-xl'}`}
              onClick={onClose}
            />

            {/* Modern Popup Container */}
            <motion.div
              initial={animationConfig.animate ? { opacity: 0, scale: 0.9, y: 20 } : { opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={animationConfig.animate ? { opacity: 0, scale: 0.9, y: 20 } : { opacity: 0 }}
              transition={{ 
                duration: animationConfig.duration, 
                ease: animationConfig.ease,
                type: isLowEnd ? "tween" : "spring",
                damping: isLowEnd ? undefined : 25,
                stiffness: isLowEnd ? undefined : 300
              }}
              className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
            >
            {/* Animated Background Elements - Disabled on low-end devices */}
            {!isLowEnd && (
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={animationConfig.animate ? { 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ 
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
                />
                <motion.div
                  animate={animationConfig.animate ? { 
                    rotate: -360,
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ 
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
                />
              </div>
            )}

            {/* Close Button */}
            <motion.button
              whileHover={isLowEnd ? {} : { scale: 1.1 }}
              whileTap={isLowEnd ? {} : { scale: 0.9 }}
              onClick={onClose}
              className="absolute top-6 right-6 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 border border-white/20"
            >
              <X size={18} className="text-white" />
            </motion.button>

            {/* Floating Decorative Icons - Simplified on low-end devices */}
            {!isLowEnd && (
              <>
                <motion.div
                  animate={animationConfig.animate ? { 
                    y: [-5, 5, -5],
                    rotate: [0, 10, 0]
                  } : {}}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-8 left-8 z-10"
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </motion.div>
                <motion.div
                  animate={animationConfig.animate ? { 
                    y: [5, -5, 5],
                    rotate: [0, -10, 0]
                  } : {}}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute top-16 right-16 z-10"
                >
                  <Star className="w-4 h-4 text-purple-400" />
                </motion.div>
              </>
            )}
            {isLowEnd && (
              <>
                <div className="absolute top-8 left-8 z-10">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div className="absolute top-16 right-16 z-10">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
              </>
            )}

            <div className="relative z-10 p-8">
              {/* Header Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                {/* Modern Icon */}
                <div className="relative mx-auto mb-6 w-20 h-20">
                  {!isLowEnd && (
                    <motion.div
                      animate={animationConfig.animate ? { rotate: 360 } : {}}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 blur-sm"
                    />
                  )}
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                    <Zap className="w-10 h-10 text-white" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className={`w-2 h-2 bg-white rounded-full ${isLowEnd ? '' : 'animate-pulse'}`} />
                    </div>
                  </div>
                </div>

                {/* Welcome Text */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2"
                >
                  Welcome to SmartGrow
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-300 text-sm"
                >
                  Your Mining Investment Journey Begins
                </motion.p>
                {userName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    <span className="text-white text-sm font-medium">Hello, {userName}!</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-4 mb-8"
              >
                {[
                  { icon: TrendingUp, label: "Daily Rewards", color: "from-green-400 to-emerald-500" },
                  { icon: Shield, label: "Secure Platform", color: "from-blue-400 to-cyan-500" },
                  { icon: Star, label: "Referral System", color: "from-purple-400 to-pink-500" }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={animationConfig.animate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: animationConfig.animate ? 0.7 + index * 0.1 : 0 }}
                    whileHover={isLowEnd ? {} : { scale: 1.05 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-white text-xs font-medium">{feature.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <motion.button
                  whileHover={isLowEnd ? {} : { scale: 1.02 }}
                  whileTap={isLowEnd ? {} : { scale: 0.98 }}
                  onClick={handleActivateMiner}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl border border-white/20 backdrop-blur-sm relative overflow-hidden group"
                >
                  {!isLowEnd && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  )}
                  <div className="relative flex items-center justify-center">
                    <Zap className="w-5 h-5 mr-2" />
                    <span>Activate Your Miner</span>
                    <ArrowRight className={`w-5 h-5 ml-2 ${isLowEnd ? '' : 'group-hover:translate-x-1 transition-transform'}`} />
                  </div>
                </motion.button>

                {whatsappGroupLink && (
                  <motion.button
                    whileHover={isLowEnd ? {} : { scale: 1.02 }}
                    whileTap={isLowEnd ? {} : { scale: 0.98 }}
                    onClick={handleJoinGroup}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl border border-white/20 backdrop-blur-sm relative overflow-hidden group"
                  >
                    {!isLowEnd && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    )}
                    <div className="relative flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      <span>Join WhatsApp Group</span>
                      <ArrowRight className={`w-5 h-5 ml-2 ${isLowEnd ? '' : 'group-hover:translate-x-1 transition-transform'}`} />
                    </div>
                  </motion.button>
                )}
              </motion.div>

              {/* Bottom Tagline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center mt-6 pt-6 border-t border-white/10"
              >
                <p className="text-slate-400 text-xs">
                  Transform Your <span className="text-yellow-400 font-semibold">Network</span> Into{' '}
                  <span className="text-green-400 font-semibold">Wealth</span> ⚡
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
})

export default WelcomePopup
