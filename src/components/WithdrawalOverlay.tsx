'use client'

import { Clock, Calendar, AlertCircle } from 'lucide-react'

interface WithdrawalOverlayProps {
  isVisible: boolean
  currentTime?: string
  startTime?: string
  endTime?: string
  allowedDays?: string[]
}

export default function WithdrawalOverlay({ 
  isVisible, 
  currentTime, 
  startTime = '11:00:00', 
  endTime = '20:00:00', 
  allowedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] 
}: WithdrawalOverlayProps) {
  if (!isVisible) return null

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  const formatDays = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    }
    
    return days.map(day => dayNames[day.toLowerCase()] || day).join(', ')
  }

  const formatCurrentTime = () => {
    if (currentTime) {
      try {
        const date = new Date(currentTime)
        return date.toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Karachi'
        })
      } catch {
        // Fallback to current Pakistani time
        return new Date().toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Karachi'
        })
      }
    }
    
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Withdrawals Not Available
        </h2>

        {/* Schedule Information */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">Withdrawal Schedule</h3>
          </div>
          
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatTime(startTime)} - {formatTime(endTime)}</span>
            </div>
            
            <div className="text-center">
              <span className="font-medium">{formatDays(allowedDays)}</span>
            </div>
            
            <div className="text-xs text-blue-600 mt-3 pt-3 border-t border-blue-200">
              Pakistani Standard Time (PKT)
            </div>
          </div>
        </div>

        {/* Current Time */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">Current Time</div>
          <div className="font-semibold text-gray-900">
            {formatCurrentTime()} (PKT)
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Please note:</p>
              <ul className="text-xs space-y-1 text-left">
                <li>• Withdrawals are processed during business hours only</li>
                <li>• Sunday is a non-working day</li>
                <li>• Please plan your withdrawals accordingly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => window.history.back()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Go Back to Dashboard
        </button>
      </div>
    </div>
  )
}
