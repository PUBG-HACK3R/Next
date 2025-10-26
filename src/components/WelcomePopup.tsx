'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Users, TrendingUp, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WelcomePopupProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

export default function WelcomePopup({ isOpen, onClose, userName }: WelcomePopupProps) {
  const [whatsappGroupLink, setWhatsappGroupLink] = useState<string | null>(null)

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
    // Close popup and redirect to dashboard
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>

            {/* Decorative Elements */}
            <div className="absolute top-8 left-8">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="absolute top-12 right-12">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>

            {/* Header with Icon */}
            <div className="pt-6 pb-2 px-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* SmartGrow Program Section */}
            <div className="px-4 mb-4">
              <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-4 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full"></div>
                  <div className="absolute top-1/2 right-8 w-8 h-8 bg-white rounded-full"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">SmartGrow Mining</h3>
                      <p className="text-blue-200 text-sm">Investment Program</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-blue-100">Benefits:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">→</span>
                        <span>Daily Mining Rewards</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">→</span>
                        <span>Referral Commission System</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">→</span>
                        <span>Secure Investment Platform</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="px-4 mb-4 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Welcome to SmartGrow Mining
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                Where Your <span className="text-yellow-500 font-semibold">💎</span> Network Becomes Your{' '}
                <span className="text-green-600 font-semibold">💰</span> Wealth Only on{' '}
                <span className="text-purple-600 font-semibold">⚡</span> SmartGrow Mining!
              </p>
              {userName && (
                <p className="text-xs text-gray-500 mt-2">
                  Hello, <span className="font-medium text-gray-700">{userName}</span>!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 space-y-3">
              <button
                onClick={handleActivateMiner}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150 shadow-lg flex items-center justify-center"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Activate Your Miner
              </button>

              {whatsappGroupLink && (
                <button
                  onClick={handleJoinGroup}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150 shadow-lg flex items-center justify-center"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Join WhatsApp Group
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
