'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface AnnouncementSettings {
  announcement_enabled: boolean
  announcement_title: string
  announcement_text: string
  announcement_type: 'info' | 'warning' | 'success' | 'error'
}

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<AnnouncementSettings | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('announcement_enabled, announcement_title, announcement_text, announcement_type')
          .eq('id', 1)
          .single()

        if (error) throw error

        console.log('Announcement data:', data) // Debug log

        if (data && data.announcement_enabled) {
          setAnnouncement(data)
          // Show announcement every time user visits dashboard
          setIsVisible(true)
          console.log('Showing announcement:', data.announcement_title) // Debug log
        } else {
          console.log('Announcement disabled or no data') // Debug log
        }
      } catch (error) {
        console.error('Error fetching announcement:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // No need to store in localStorage since we show every time
  }

  const getIcon = () => {
    switch (announcement?.announcement_type) {
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />
      default:
        return <Info className="w-6 h-6 text-blue-400" />
    }
  }

  const getColors = () => {
    switch (announcement?.announcement_type) {
      case 'warning':
        return {
          bg: 'from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-100'
        }
      case 'success':
        return {
          bg: 'from-green-500/20 to-emerald-500/20',
          border: 'border-green-500/50',
          text: 'text-green-100'
        }
      case 'error':
        return {
          bg: 'from-red-500/20 to-pink-500/20',
          border: 'border-red-500/50',
          text: 'text-red-100'
        }
      default:
        return {
          bg: 'from-blue-500/20 to-indigo-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-100'
        }
    }
  }

  if (loading || !announcement || !isVisible) {
    return null
  }

  const colors = getColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative max-w-md w-full bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-2xl border ${colors.border} shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            {getIcon()}
            <h2 className="text-xl font-bold text-white">
              {announcement.announcement_title}
            </h2>
          </div>

          <div className={`${colors.text} text-sm leading-relaxed whitespace-pre-wrap`}>
            {announcement.announcement_text}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
