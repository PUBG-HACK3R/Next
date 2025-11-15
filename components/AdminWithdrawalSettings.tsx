'use client'

import { useEffect, useState } from 'react'
import { 
  Settings, 
  Clock, 
  Calendar, 
  ToggleLeft, 
  ToggleRight, 
  Save,
  AlertCircle,
  CheckCircle,
  History
} from 'lucide-react'

interface WithdrawalSettings {
  withdrawal_enabled: boolean
  withdrawal_start_time: string
  withdrawal_end_time: string
  withdrawal_days_enabled: string
  withdrawal_auto_schedule: boolean
  withdrawal_timezone: string
}

export default function AdminWithdrawalSettings() {
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [reason, setReason] = useState('')

  // Form states
  const [startTime, setStartTime] = useState('11:00')
  const [endTime, setEndTime] = useState('20:00')
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ])

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      
      if (data.success) {
        const withdrawalSettings = data.settings
        setSettings(withdrawalSettings)
        
        // Update form states
        if (withdrawalSettings.withdrawal_start_time) {
          setStartTime(withdrawalSettings.withdrawal_start_time.substring(0, 5))
        }
        if (withdrawalSettings.withdrawal_end_time) {
          setEndTime(withdrawalSettings.withdrawal_end_time.substring(0, 5))
        }
        if (withdrawalSettings.withdrawal_days_enabled) {
          setSelectedDays(withdrawalSettings.withdrawal_days_enabled.split(','))
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showMessage('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleToggleWithdrawals = async () => {
    if (!settings) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/withdrawal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_withdrawals',
          enabled: !settings.withdrawal_enabled,
          reason: reason || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSettings(prev => prev ? { ...prev, withdrawal_enabled: !prev.withdrawal_enabled } : null)
        showMessage('success', `Withdrawals ${!settings.withdrawal_enabled ? 'enabled' : 'disabled'} successfully`)
        setReason('')
      } else {
        showMessage('error', data.error || 'Failed to update withdrawal status')
      }
    } catch (error) {
      console.error('Error toggling withdrawals:', error)
      showMessage('error', 'Failed to update withdrawal status')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSchedule = async () => {
    if (!settings) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/withdrawal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_schedule',
          enabled: !settings.withdrawal_auto_schedule,
          reason: reason || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSettings(prev => prev ? { ...prev, withdrawal_auto_schedule: !prev.withdrawal_auto_schedule } : null)
        showMessage('success', `Auto schedule ${!settings.withdrawal_auto_schedule ? 'enabled' : 'disabled'} successfully`)
        setReason('')
      } else {
        showMessage('error', data.error || 'Failed to update schedule setting')
      }
    } catch (error) {
      console.error('Error toggling schedule:', error)
      showMessage('error', 'Failed to update schedule setting')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTimes = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/withdrawal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_times',
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          allowed_days: selectedDays.join(','),
          reason: reason || undefined
        })
      })

      const data = await response.json()
      
      if (data.success) {
        showMessage('success', 'Withdrawal times updated successfully')
        setReason('')
        fetchSettings() // Refresh settings
      } else {
        showMessage('error', data.error || 'Failed to update withdrawal times')
      }
    } catch (error) {
      console.error('Error updating times:', error)
      showMessage('error', 'Failed to update withdrawal times')
    } finally {
      setSaving(false)
    }
  }

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Settings className="w-6 h-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-800">Withdrawal Settings</h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </span>
        </div>
      )}

      {settings && (
        <div className="space-y-6">
          {/* Master Toggle */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Withdrawal System</h3>
                <p className="text-sm text-gray-600">Enable or disable all withdrawals</p>
              </div>
              <button
                onClick={handleToggleWithdrawals}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                {settings.withdrawal_enabled ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>
            <div className={`text-sm font-medium ${
              settings.withdrawal_enabled ? 'text-green-600' : 'text-red-600'
            }`}>
              Status: {settings.withdrawal_enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {/* Auto Schedule Toggle */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Auto Schedule</h3>
                <p className="text-sm text-gray-600">Automatically restrict withdrawals by time and day</p>
              </div>
              <button
                onClick={handleToggleSchedule}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                {settings.withdrawal_auto_schedule ? (
                  <ToggleRight className="w-8 h-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>
            <div className={`text-sm font-medium ${
              settings.withdrawal_auto_schedule ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {settings.withdrawal_auto_schedule 
                ? 'Time restrictions active' 
                : 'Manual control only (24/7 when enabled)'}
            </div>
          </div>

          {/* Time Settings */}
          {settings.withdrawal_auto_schedule && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Time Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Allowed Days
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.key)}
                        onChange={() => handleDayToggle(day.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Change (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for this change..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleUpdateTimes}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Time Settings'}</span>
              </button>
            </div>
          )}

          {/* Current Status Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Current Configuration</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>System: <span className="font-medium">{settings.withdrawal_enabled ? 'Enabled' : 'Disabled'}</span></div>
              <div>Auto Schedule: <span className="font-medium">{settings.withdrawal_auto_schedule ? 'Active' : 'Inactive'}</span></div>
              {settings.withdrawal_auto_schedule && (
                <>
                  <div>Hours: <span className="font-medium">{startTime} - {endTime} (Pakistani Time)</span></div>
                  <div>Days: <span className="font-medium">{selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
