'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WhatsAppSupportProps {
  variant?: 'floating' | 'button' | 'link'
  className?: string
  showText?: boolean
}

export default function WhatsAppSupport({ 
  variant = 'button', 
  className = '',
  showText = true 
}: WhatsAppSupportProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('whatsapp_support_number')
          .eq('id', 1)
          .single()

        if (error) throw error

        if (data?.whatsapp_support_number) {
          setWhatsappNumber(data.whatsapp_support_number)
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error)
      }
      setLoading(false)
    }

    fetchWhatsAppNumber()
  }, [])

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) return

    // Clean the number and create WhatsApp URL
    const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '')
    const message = encodeURIComponent('Hello! I need support with SmartGrow Mining platform.')
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`
    
    window.open(whatsappUrl, '_blank')
  }

  if (loading || !whatsappNumber) {
    return null
  }

  const baseClasses = "flex items-center justify-center transition-all duration-200"

  if (variant === 'floating') {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={`fixed bottom-24 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 ${baseClasses} ${className}`}
        title="Contact Support on WhatsApp"
      >
        <MessageCircle size={24} />
      </button>
    )
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={`text-green-600 hover:text-green-700 underline ${baseClasses} ${className}`}
      >
        <MessageCircle size={16} className="mr-1" />
        {showText && 'Contact Support'}
      </button>
    )
  }

  // Default button variant
  return (
    <button
      onClick={handleWhatsAppClick}
      className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium space-x-2 ${baseClasses} ${className}`}
    >
      <MessageCircle size={20} />
      {showText && <span>Contact Support</span>}
    </button>
  )
}
