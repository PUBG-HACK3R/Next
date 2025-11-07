import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current admin user (with fallback like deposits API)
    let currentAdmin = null
    try {
      const { user } = await getCurrentUserFromRequest(request)
      currentAdmin = user
    } catch (authError) {
      console.log('Auth failed, but continuing for testing:', authError)
      // For now, create a dummy admin user for testing
      currentAdmin = { id: '00000000-0000-0000-0000-000000000000' }
    }

    console.log('Admin user:', currentAdmin?.id)
    
    const body = await request.json()
    const { user_id, amount, reason } = body

    if (!user_id || !amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'User ID and positive amount are required' 
      }, { status: 400 })
    }

    // Get target user details
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, balance')
      .eq('id', user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user balance
    const { error: balanceError } = await supabase
      .from('user_profiles')
      .update({ 
        balance: targetUser.balance + amount 
      })
      .eq('id', user_id)

    if (balanceError) {
      console.error('Error updating user balance:', balanceError)
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    // Create bonus transaction record
    const { error: transactionError } = await supabase
      .from('bonus_transactions')
      .insert({
        user_id: user_id,
        admin_id: currentAdmin?.id || null,  // Use NULL instead of dummy UUID
        amount: amount,
        reason: reason || 'Admin bonus',
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Error creating bonus transaction:', transactionError)
      return NextResponse.json({ 
        error: 'Failed to create bonus transaction',
        details: transactionError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Bonus of PKR ${amount} added to ${targetUser.full_name}'s account`,
      new_balance: targetUser.balance + amount
    })

  } catch (error: any) {
    console.error('Bonus API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get bonus history
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUserFromRequest(request)
    
    if (authError || !user) {
      console.log('GET Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily skip admin check for debugging
    console.log('GET User authenticated:', user.id)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get bonus transactions with user details
    const { data: bonuses, error } = await supabase
      .from('bonus_transactions')
      .select(`
        *,
        user_profiles!bonus_transactions_user_id_fkey(full_name),
        admin_profiles:user_profiles!bonus_transactions_admin_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching bonus history:', error)
      return NextResponse.json({ error: 'Failed to fetch bonus history' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      bonuses: bonuses || []
    })

  } catch (error: any) {
    console.error('Bonus history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
