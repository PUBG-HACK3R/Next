import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile, getCurrentUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { user: requestUser, error: requestError } = await getCurrentUserFromRequest(request)
    
    let user = requestUser
    let authError = requestError
    
    // Fallback to regular auth if header auth fails
    if (!user) {
      const result = await getCurrentUserWithProfile()
      user = result.user
      authError = result.error
    }
    
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // CRITICAL FIX: Filter deposits by user ID
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError)
      return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
    }

    const { count, error: countError } = await supabase
      .from('deposits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting deposits:', countError)
      return NextResponse.json({ error: 'Failed to count deposits' }, { status: 500 })
    }

    return NextResponse.json({
      deposits,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Deposits API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: requestUser, error: requestError } = await getCurrentUserFromRequest(request)
    
    let user = requestUser
    let authError = requestError
    
    if (!user) {
      const result = await getCurrentUserWithProfile()
      user = result.user
      authError = result.error
    }
    
    if (!user || authError) {
      console.error('Auth error in deposits POST API:', { user: !!user, error: authError })
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: authError?.message || 'No user found',
        debug: { hasUser: !!user }
      }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const body = await request.json()
    const { 
      deposit_type, 
      amount_pkr, 
      sender_name, 
      sender_account_last4,
      amount_usdt,
      chain_name,
      transaction_hash,
      proof_url 
    } = body

    if (!deposit_type || !amount_pkr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['bank', 'easypaisa', 'usdt'].includes(deposit_type)) {
      return NextResponse.json({ error: 'Invalid deposit type' }, { status: 400 })
    }

    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'Failed to load system settings' }, { status: 500 })
    }

    if (deposit_type === 'usdt') {
      if (!amount_usdt || amount_usdt < settings.min_usdt_deposit) {
        return NextResponse.json({ 
          error: `Minimum USDT deposit is ${settings.min_usdt_deposit} USDT` 
        }, { status: 400 })
      }
      if (!chain_name || !transaction_hash) {
        return NextResponse.json({ 
          error: 'Chain name and transaction hash are required for USDT deposits' 
        }, { status: 400 })
      }
    } else {
      if (amount_pkr < settings.min_deposit_amount) {
        return NextResponse.json({ 
          error: `Minimum deposit amount is PKR ${settings.min_deposit_amount}` 
        }, { status: 400 })
      }
      if (!sender_name || !sender_account_last4) {
        return NextResponse.json({ 
          error: 'Sender name and account last 4 digits are required' 
        }, { status: 400 })
      }
    }

    const depositData: any = {
      user_id: user.id,
      deposit_type,
      amount_pkr,
      proof_url,
      status: 'pending'
    }

    if (deposit_type === 'usdt') {
      depositData.amount_usdt = amount_usdt
      depositData.usdt_rate = settings.usdt_to_pkr_rate
      depositData.chain_name = chain_name
      depositData.transaction_hash = transaction_hash
      depositData.wallet_address = settings.usdt_wallet_address
    } else {
      depositData.sender_name = sender_name
      depositData.sender_account_last4 = sender_account_last4
    }

    const { data: deposit, error: insertError } = await supabase
      .from('deposits')
      .insert([depositData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating deposit:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        depositData
      })
      return NextResponse.json({ 
        error: 'Failed to create deposit',
        details: insertError.message,
        hint: insertError.hint,
        code: insertError.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      deposit,
      message: 'Deposit request submitted successfully' 
    })

  } catch (error) {
    console.error('Deposit creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}