import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, fee_amount, fee_percent, total_deducted } = body

    // Use a direct SQL query to bypass the trigger
    const { data, error } = await supabase.rpc('create_withdrawal_bypass_trigger', {
      p_user_id: user.id,
      p_amount: amount,
      p_fee_amount: fee_amount,
      p_fee_percent: fee_percent,
      p_total_deducted: total_deducted
    })

    if (error) {
      console.error('Error creating withdrawal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Withdrawal creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
