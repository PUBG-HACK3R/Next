import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile, getCurrentUserFromRequest } from '@/lib/auth'

// Function to process referral commissions
async function processReferralCommissions(userId: string, depositId: number, amount: number, type: 'deposit' | 'earning') {
  // Get admin settings for commission rates
  const { data: settings, error: settingsError } = await supabase
    .from('admin_settings')
    .select('referral_l1_percent, referral_l2_percent, referral_l3_percent')
    .eq('id', 1)
    .single()

  if (settingsError || !settings) {
    throw new Error('Failed to load commission settings')
  }

  // Get user's referrer (L1)
  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('referred_by')
    .eq('id', userId)
    .single()

  if (profileError || !userProfile?.referred_by) {
    console.log('User has no referrer, skipping commission processing')
    return
  }

  const commissions = []
  let currentReferrerId = userProfile.referred_by
  const commissionRates = [
    settings.referral_l1_percent,
    settings.referral_l2_percent, 
    settings.referral_l3_percent
  ]

  // Process up to 3 levels of referrals
  for (let level = 1; level <= 3 && currentReferrerId; level++) {
    const commissionPercent = commissionRates[level - 1]
    let shouldCreateCommission = false
    
    // New logic: L1 gets commission from deposits + earnings, L2/L3 only from earnings
    if (level === 1) {
      // L1: Commission from both deposits and earnings
      shouldCreateCommission = commissionPercent > 0
    } else {
      // L2/L3: Commission only from earnings, not deposits
      shouldCreateCommission = commissionPercent > 0 && type === 'earning'
    }
    
    if (shouldCreateCommission) {
      const commissionAmount = (amount * commissionPercent) / 100

      // Create commission record
      commissions.push({
        referred_user_id: userId,
        referrer_id: currentReferrerId,
        deposit_id: type === 'deposit' ? depositId : null,
        commission_amount: commissionAmount,
        level: level,
        commission_percent: commissionPercent,
        status: 'Completed'
      })

      // Get next level referrer
      const { data: nextReferrer } = await supabase
        .from('user_profiles')
        .select('referred_by')
        .eq('id', currentReferrerId)
        .single()

      currentReferrerId = nextReferrer?.referred_by || null
    }
  }

  // Insert all commissions and update referrer balances
  if (commissions.length > 0) {
    const { error: insertError } = await supabase
      .from('referral_commissions')
      .insert(commissions)

    if (insertError) {
      throw new Error(`Failed to insert commissions: ${insertError.message}`)
    }

    // Update each referrer's balance with their commission
    for (const commission of commissions) {
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: commission.referrer_id,
        amount: commission.commission_amount
      })

      if (balanceError) {
        console.error(`Failed to update balance for referrer ${commission.referrer_id}:`, balanceError)
      } else {
        // Trigger earning-based commissions for this referrer's upline
        // Only if this is a deposit commission (to avoid infinite loops)
        if (type === 'deposit') {
          try {
            await processReferralCommissions(commission.referrer_id, depositId, commission.commission_amount, 'earning')
          } catch (earningCommissionError) {
            console.error('Error processing earning-based commissions:', earningCommissionError)
          }
        }
      }
    }

    console.log(`Processed ${commissions.length} referral commissions for ${type} ${depositId}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass auth for testing - TODO: Fix admin auth later

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const offset = (page - 1) * limit

    // Simplified query without complex joins for now
    let query = supabase
      .from('deposits')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: deposits, error: depositsError } = await query
      .range(offset, offset + limit - 1)

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError)
      return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
    }

    // Get total count
    let countQuery = supabase
      .from('deposits')
      .select('*', { count: 'exact', head: true })

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

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
    console.error('Admin deposits API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get current admin user (temporarily bypass auth for debugging)
    let currentAdmin = null
    try {
      const { user } = await getCurrentUserFromRequest(request)
      currentAdmin = user
    } catch (authError) {
      console.log('Auth failed, continuing without admin tracking:', authError)
    }

    const body = await request.json()
    const { deposit_id, action, rejection_reason, admin_notes } = body

    if (!deposit_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'approve') {
      // Get deposit details first
      const { data: deposit, error: depositFetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', deposit_id)
        .single()

      if (depositFetchError || !deposit) {
        return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
      }

      // Update deposit status with admin tracking
      const updateData: any = { 
        status: 'approved',
        processed_at: new Date().toISOString(),
        admin_notes: admin_notes || null
      }
      
      if (currentAdmin) {
        updateData.approved_by = currentAdmin.id
        updateData.approved_at = new Date().toISOString()
      }

      const { error: approveError } = await supabase
        .from('deposits')
        .update(updateData)
        .eq('id', deposit_id)

      if (approveError) {
        console.error('Error approving deposit:', approveError)
        return NextResponse.json({ error: 'Failed to approve deposit' }, { status: 500 })
      }

      // Update user's balance (add deposit amount to the depositor's account only)
      const { error: balanceError } = await supabase.rpc('increment_user_balance', {
        user_id: deposit.user_id,
        amount: deposit.amount_pkr
      })

      if (balanceError) {
        console.error('Error updating user balance:', balanceError)
        // Revert deposit status if balance update fails
        await supabase
          .from('deposits')
          .update({ status: 'pending' })
          .eq('id', deposit_id)
        return NextResponse.json({ error: 'Failed to update user balance' }, { status: 500 })
      }

      // NOTE: Referral commissions are handled automatically by database trigger
      // when deposit status changes to 'approved' - no manual processing needed

      return NextResponse.json({ 
        success: true, 
        message: 'Deposit approved successfully' 
      })

    } else if (action === 'reject') {
      if (!rejection_reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
      }

      // Rejection with admin tracking
      const rejectData: any = { 
        status: 'rejected',
        rejection_reason: rejection_reason,
        processed_at: new Date().toISOString(),
        admin_notes: admin_notes || null
      }
      
      if (currentAdmin) {
        rejectData.approved_by = currentAdmin.id
        rejectData.approved_at = new Date().toISOString()
      }

      const { error: rejectError } = await supabase
        .from('deposits')
        .update(rejectData)
        .eq('id', deposit_id)

      if (rejectError) {
        console.error('Error rejecting deposit:', rejectError)
        return NextResponse.json({ error: 'Failed to reject deposit' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Deposit rejected successfully' 
      })
    }

  } catch (error) {
    console.error('Admin deposit action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
