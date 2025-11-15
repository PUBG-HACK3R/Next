import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get admin settings - this endpoint can be accessed by all users for deposit form
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Admin settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, profile, error } = await getCurrentUserWithProfile()
    
    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!profile || profile.user_level < 999) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    // Update admin settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('admin_settings')
      .update(body)
      .eq('id', 1)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating admin settings:', updateError)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings,
      message: 'Settings updated successfully' 
    })

  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
