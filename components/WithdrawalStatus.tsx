'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock, CheckCircle, XCircle, Calendar, AlertCircle } from 'lucide-react'

interface WithdrawalStatus {
  withdrawal_allowed: boolean
  manual_override: boolean
  admin_disabled: boolean
  current_time_pk: string
  current_day: string
  allowed_days: string[]
  allowed_hours: {
    start: string
    end: string
  }
  next_available_time: string | null
  timezone: string
}

interface WithdrawalStatusProps {
  onStatusChange?: (allowed: boolean, currentTime?: string, schedule?: {
    startTime: string,
    endTime: string,
    allowedDays: string[]
  }) => void
  showDetails?: boolean
}

export default function WithdrawalStatus({ onStatusChange, showDetails = true }: WithdrawalStatusProps) {
  const [status, setStatus] = useState<WithdrawalStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const previousStatusRef = useRef<string | null>(null)

  useEffect(() => {
    fetchWithdrawalStatus()
    
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    // Check status every 5 minutes
    const statusInterval = setInterval(() => {
      fetchWithdrawalStatus()
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(statusInterval)
    }
  }, [])

  useEffect(() => {
    if (status && onStatusChange) {
      // Create a unique key for the current status to detect changes
      const statusKey = `${status.withdrawal_allowed}-${status.current_time_pk}-${status.allowed_hours.start}-${status.allowed_hours.end}-${status.allowed_days.join(',')}`
      
      // Only call onStatusChange if the status has actually changed
      if (previousStatusRef.current !== statusKey) {
        previousStatusRef.current = statusKey
        onStatusChange(
          status.withdrawal_allowed, 
          status.current_time_pk,
          {
            startTime: status.allowed_hours.start,
            endTime: status.allowed_hours.end,
            allowedDays: status.allowed_days
          }
        )
      }
    }
  }, [status, onStatusChange])

  const fetchWithdrawalStatus = async () => {
    try {
      const response = await fetch('/api/withdrawal/status')
      const data = await response.json()
      
      console.log('Withdrawal Status API Response:', data)
      
      if (data.success && data.status) {
        console.log('Setting withdrawal status:', data.status)
        setStatus(data.status)
      } else {
        // If API fails, try to get admin settings directly and calculate status
        try {
          const settingsResponse = await fetch('/api/admin/settings')
          const settingsData = await settingsResponse.json()
          
          console.log('Admin Settings API Response:', settingsData)
          
          let startTime = '11:00:00'
          let endTime = '20:00:00'
          let allowedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          let withdrawalEnabled = true
          let autoSchedule = true
          
          if (settingsData && !settingsData.error) {
            startTime = settingsData.withdrawal_start_time || '11:00:00'
            endTime = settingsData.withdrawal_end_time || '20:00:00'
            allowedDays = settingsData.withdrawal_days_enabled ? 
              settingsData.withdrawal_days_enabled.split(',') : 
              ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            withdrawalEnabled = settingsData.withdrawal_enabled ?? true
            autoSchedule = settingsData.withdrawal_auto_schedule ?? true
          }
          
          const now = new Date()
          const pakistaniTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
          const currentHour = pakistaniTime.getHours()
          const currentMinute = pakistaniTime.getMinutes()
          const currentDay = pakistaniTime.getDay()
          const currentDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDay]
          
          let isAllowed = withdrawalEnabled
          
          if (withdrawalEnabled && autoSchedule) {
            // Parse start and end times
            const [startHour, startMinute] = startTime.split(':').map(Number)
            const [endHour, endMinute] = endTime.split(':').map(Number)
            
            const currentTimeInMinutes = currentHour * 60 + currentMinute
            const startTimeInMinutes = startHour * 60 + startMinute
            const endTimeInMinutes = endHour * 60 + endMinute
            
            const isWithinHours = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
            const isAllowedDay = allowedDays.includes(currentDayName)
            isAllowed = isWithinHours && isAllowedDay
          }
          
          setStatus({
            withdrawal_allowed: isAllowed,
            manual_override: !autoSchedule,
            admin_disabled: !withdrawalEnabled,
            current_time_pk: pakistaniTime.toISOString(),
            current_day: currentDayName,
            allowed_days: allowedDays,
            allowed_hours: {
              start: startTime,
              end: endTime
            },
            next_available_time: null,
            timezone: 'Asia/Karachi'
          })
        } catch (settingsError) {
          console.error('Error fetching admin settings:', settingsError)
          // Final fallback with default values
          const now = new Date()
          const pakistaniTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
          const currentDay = pakistaniTime.getDay()
          const currentDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDay]
          
          setStatus({
            withdrawal_allowed: false,
            manual_override: false,
            admin_disabled: false,
            current_time_pk: pakistaniTime.toISOString(),
            current_day: currentDayName,
            allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            allowed_hours: {
              start: '11:00:00',
              end: '20:00:00'
            },
            next_available_time: null,
            timezone: 'Asia/Karachi'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching withdrawal status:', error)
      // Fallback: assume withdrawals are not allowed and show schedule
      setStatus({
        withdrawal_allowed: false,
        manual_override: false,
        admin_disabled: false,
        current_time_pk: new Date().toISOString(),
        current_day: 'unknown',
        allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        allowed_hours: {
          start: '11:00:00',
          end: '20:00:00'
        },
        next_available_time: null,
        timezone: 'Asia/Karachi'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`)
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday', 
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    }
    return days[day.toLowerCase()] || day
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-gray-600">Checking withdrawal availability...</span>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-center space-x-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">Unable to check withdrawal status</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-4 border ${
      status.withdrawal_allowed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center space-x-2 mb-2">
        {status.withdrawal_allowed ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <span className={`font-semibold ${
          status.withdrawal_allowed ? 'text-green-700' : 'text-red-700'
        }`}>
          {status.withdrawal_allowed ? 'Withdrawals Available' : 'Withdrawals Not Available'}
        </span>
      </div>

      {showDetails && (
        <div className="space-y-2 text-sm">
          {status.admin_disabled && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>Withdrawals have been temporarily disabled by admin</span>
            </div>
          )}

          {status.manual_override && !status.admin_disabled && (
            <div className="flex items-center space-x-2 text-blue-600">
              <AlertCircle className="w-4 h-4" />
              <span>Manual override active - withdrawals available 24/7</span>
            </div>
          )}

          {!status.manual_override && !status.admin_disabled && (
            <>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Available: {formatTime(status.allowed_hours.start)} - {formatTime(status.allowed_hours.end)} 
                  ({status.timezone})
                </span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Days: {status.allowed_days.map(day => getDayName(day)).join(', ')}
                </span>
              </div>

              <div className="text-gray-600">
                Current time: {new Date(status.current_time_pk).toLocaleString('en-US', {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'Asia/Karachi'
                })} (Pakistani Time)
              </div>

              {!status.withdrawal_allowed && status.next_available_time && (
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="text-blue-700 font-medium">Next Available:</div>
                  <div className="text-blue-600">
                    {formatDateTime(status.next_available_time)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
