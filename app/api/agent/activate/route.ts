import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    // Check if the requesting user is an admin
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('user_level')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.user_level < 999) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if the target user is eligible
    const { data: eligibilityData } = await supabase
      .from('agent_eligibility_tracking')
      .select('eligibility_achieved')
      .eq('user_id', userId)
      .single()

    if (!eligibilityData?.eligibility_achieved) {
      return NextResponse.json({ error: 'User is not eligible for agent program' }, { status: 400 })
    }

    // Activate the agent using the database function
    const { data, error } = await supabase.rpc('activate_agent', { 
      user_id: userId 
    })

    if (error) {
      console.error('Error activating agent:', error)
      return NextResponse.json({ error: 'Failed to activate agent' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Agent activation failed - user may not be eligible' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Agent activated successfully',
      data 
    })

  } catch (error) {
    console.error('Agent activation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
