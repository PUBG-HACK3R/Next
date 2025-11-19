import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { investmentId, userId, amount, reason } = await request.json()

    // Validate inputs
    if (!investmentId || !userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid input parameters' },
        { status: 400 }
      )
    }

    // Get investment details
    const { data: investment, error: investmentError } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .eq('user_id', userId)
      .single()

    if (investmentError || !investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      )
    }

    // Add earnings to user balance
    const { error: balanceError } = await supabaseAdmin.rpc('increment_user_balance', {
      user_id: userId,
      amount: amount
    })

    if (balanceError) {
      return NextResponse.json(
        { error: 'Failed to update balance: ' + balanceError.message },
        { status: 500 }
      )
    }

    // Record the transaction
    const { error: transactionError } = await supabaseAdmin
      .from('income_transactions')
      .insert({
        user_id: userId,
        investment_id: investmentId,
        amount: amount,
        days_collected: 0,
        is_final_collection: true,
        status: 'completed',
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Transaction recording error:', transactionError)
      // Don't fail if transaction recording fails, balance was already updated
    }

    // Create admin log
    const { error: logError } = await supabaseAdmin
      .from('admin_logs')
      .insert({
        action: 'manual_earnings_given',
        user_id: userId,
        investment_id: investmentId,
        amount: amount,
        reason: reason || 'Manual earnings adjustment',
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Log error:', logError)
      // Don't fail if logging fails
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully added ${amount} PKR to user balance`,
        investment: investment
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in manual earnings endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}
