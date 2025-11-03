import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's agent profile and eligibility
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_agent, agent_status, agent_activated_at')
      .eq('id', user.id)
      .single()

    // Get eligibility tracking
    let eligibility = null
    const { data: eligibilityData } = await supabase
      .from('agent_eligibility_tracking')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (eligibilityData) {
      eligibility = eligibilityData
    } else {
      // If no tracking record exists, create one
      await supabase.rpc('update_agent_eligibility', { user_id: user.id })
      
      // Fetch the newly created record
      const { data: newEligibilityData } = await supabase
        .from('agent_eligibility_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      eligibility = newEligibilityData
    }

    // Get agent settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select(`
        agent_initial_bonus, agent_weekly_salary, agent_commission_percent,
        agent_l1_requirement, agent_l2_requirement, agent_l3_requirement,
        agent_salary_l1_requirement, agent_salary_l2_requirement, agent_salary_l3_requirement
      `)
      .eq('id', 1)
      .single()

    return NextResponse.json({
      profile,
      eligibility,
      settings
    })

  } catch (error) {
    console.error('Agent eligibility fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update agent eligibility for the current user
    const { error } = await supabase.rpc('update_agent_eligibility', { 
      user_id: user.id 
    })

    if (error) {
      console.error('Error updating agent eligibility:', error)
      return NextResponse.json({ error: 'Failed to update eligibility' }, { status: 500 })
    }

    // Fetch updated eligibility data
    const { data: eligibilityData } = await supabase
      .from('agent_eligibility_tracking')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      eligibility: eligibilityData
    })

  } catch (error) {
    console.error('Agent eligibility update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
