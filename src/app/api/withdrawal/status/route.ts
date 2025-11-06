import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get admin settings from the database
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('withdrawal_enabled, withdrawal_start_time, withdrawal_end_time, withdrawal_days_enabled, withdrawal_auto_schedule')
      .eq('id', 1)
      .single()

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError)
    }

    // Use admin settings or defaults
    const withdrawalEnabled = adminSettings?.withdrawal_enabled ?? true
    const withdrawalAutoSchedule = adminSettings?.withdrawal_auto_schedule ?? false // Temporarily disabled for testing
    const startTime = adminSettings?.withdrawal_start_time || '11:00:00'
    const endTime = adminSettings?.withdrawal_end_time || '20:00:00'
    const allowedDays = adminSettings?.withdrawal_days_enabled ? 
      adminSettings.withdrawal_days_enabled.split(',') : 
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    console.log('Withdrawal Settings:', {
      withdrawalEnabled,
      withdrawalAutoSchedule,
      startTime,
      endTime,
      allowedDays
    })

    // If withdrawals are disabled by admin
    if (!withdrawalEnabled) {
      return NextResponse.json({
        success: true,
        status: {
          withdrawal_allowed: false,
          manual_override: false,
          admin_disabled: true,
          current_time_pk: new Date().toISOString(),
          current_day: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          allowed_days: allowedDays,
          allowed_hours: {
            start: startTime,
            end: endTime
          },
          next_available_time: null,
          timezone: 'Asia/Karachi'
        }
      })
    }

    // If auto schedule is disabled, allow withdrawals 24/7
    if (!withdrawalAutoSchedule) {
      return NextResponse.json({
        success: true,
        status: {
          withdrawal_allowed: true,
          manual_override: true,
          admin_disabled: false,
          current_time_pk: new Date().toISOString(),
          current_day: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          allowed_days: allowedDays,
          allowed_hours: {
            start: startTime,
            end: endTime
          },
          next_available_time: null,
          timezone: 'Asia/Karachi'
        }
      })
    }

    // Calculate current Pakistani time
    const now = new Date()
    const pakistaniTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
    const currentHour = pakistaniTime.getHours()
    const currentMinute = pakistaniTime.getMinutes()
    const currentDay = pakistaniTime.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDay]

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    // Check if current time is within allowed hours
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    const startTimeInMinutes = startHour * 60 + startMinute
    const endTimeInMinutes = endHour * 60 + endMinute

    const isWithinHours = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
    const isAllowedDay = allowedDays.includes(currentDayName)
    const isAllowed = isWithinHours && isAllowedDay

    console.log('Time Check:', {
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
      currentTimeInMinutes,
      startTimeInMinutes,
      endTimeInMinutes,
      isWithinHours,
      currentDayName,
      isAllowedDay,
      isAllowed
    })

    // Calculate next available time if not currently allowed
    let nextAvailableTime = null
    if (!isAllowed) {
      // Find next available day and time
      for (let i = 0; i <= 7; i++) {
        const checkDate = new Date(pakistaniTime)
        checkDate.setDate(checkDate.getDate() + i)
        const checkDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][checkDate.getDay()]
        
        if (allowedDays.includes(checkDay)) {
          if (i === 0 && currentTimeInMinutes < startTimeInMinutes) {
            // Today but before start time
            checkDate.setHours(startHour, startMinute, 0, 0)
            nextAvailableTime = checkDate.toISOString()
            break
          } else if (i > 0) {
            // Future day
            checkDate.setHours(startHour, startMinute, 0, 0)
            nextAvailableTime = checkDate.toISOString()
            break
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        withdrawal_allowed: isAllowed,
        manual_override: false,
        admin_disabled: false,
        current_time_pk: pakistaniTime.toISOString(),
        current_day: currentDayName,
        allowed_days: allowedDays,
        allowed_hours: {
          start: startTime,
          end: endTime
        },
        next_available_time: nextAvailableTime,
        timezone: 'Asia/Karachi'
      }
    })

  } catch (error) {
    console.error('Withdrawal status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin endpoint to toggle withdrawals
export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('user_level')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.user_level < 999) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, enabled, start_time, end_time, allowed_days, reason } = await request.json()

    let result = null
    let logAction = ''
    let oldValue = ''
    let newValue = ''

    switch (action) {
      case 'toggle_withdrawals':
        const { data: toggleResult, error: toggleError } = await supabase.rpc('admin_toggle_withdrawals', { 
          enabled 
        })
        
        if (toggleError) throw toggleError
        
        result = toggleResult
        logAction = enabled ? 'enabled' : 'disabled'
        oldValue = (!enabled).toString()
        newValue = enabled.toString()
        break

      case 'toggle_schedule':
        const { data: scheduleResult, error: scheduleError } = await supabase.rpc('admin_toggle_withdrawal_schedule', { 
          auto_enabled: enabled 
        })
        
        if (scheduleError) throw scheduleError
        
        result = scheduleResult
        logAction = enabled ? 'schedule_enabled' : 'schedule_disabled'
        oldValue = (!enabled).toString()
        newValue = enabled.toString()
        break

      case 'update_times':
        const { data: timeResult, error: timeError } = await supabase.rpc('admin_update_withdrawal_times', { 
          start_time, 
          end_time, 
          allowed_days 
        })
        
        if (timeError) throw timeError
        
        result = timeResult
        logAction = 'time_updated'
        oldValue = 'Previous settings'
        newValue = `${start_time}-${end_time}, Days: ${allowed_days}`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log the admin action
    await supabase.rpc('log_withdrawal_admin_action', {
      admin_user_id: user.id,
      action_type: logAction,
      old_val: oldValue,
      new_val: newValue,
      reason_text: reason || null
    })

    return NextResponse.json({
      success: true,
      result,
      message: `Withdrawal settings updated successfully`
    })

  } catch (error) {
    console.error('Withdrawal admin action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
