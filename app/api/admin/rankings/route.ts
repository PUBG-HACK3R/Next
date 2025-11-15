import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser, getUserProfile } from '@/lib/auth'

interface UserProfile {
  id: string
  full_name: string
  email: string
}

interface DepositData {
  user_id: string
  user_profiles: UserProfile
  amount: number
}

interface WithdrawalData {
  user_id: string
  user_profiles: UserProfile
  amount: number
}

interface ReferralData {
  id: string
  full_name: string
  email: string
  referral_count: number
}

export async function GET() {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await getUserProfile(user.id)
    if (!profile || profile.user_level < 999) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServerSupabaseClient()

    // Get top users by total deposits
    const { data: topDeposits, error: depositsError } = await supabase
      .from('deposits')
      .select(`
        user_id,
        user_profiles!inner(full_name, email),
        amount
      `)
      .eq('status', 'approved')
      .order('amount', { ascending: false })

    if (depositsError) {
      console.error('Deposits query error:', depositsError)
      return NextResponse.json({ error: 'Failed to fetch deposit rankings' }, { status: 500 })
    }

    // Get top users by total withdrawals
    const { data: topWithdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select(`
        user_id,
        user_profiles!inner(full_name, email),
        amount
      `)
      .eq('status', 'approved')
      .order('amount', { ascending: false })

    if (withdrawalsError) {
      console.error('Withdrawals query error:', withdrawalsError)
      return NextResponse.json({ error: 'Failed to fetch withdrawal rankings' }, { status: 500 })
    }

    // Get top users by referral count
    const { data: topReferrals, error: referralsError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        referral_count
      `)
      .not('referral_count', 'is', null)
      .order('referral_count', { ascending: false })

    if (referralsError) {
      console.error('Referrals query error:', referralsError)
      return NextResponse.json({ error: 'Failed to fetch referral rankings' }, { status: 500 })
    }

    // Process deposits data - group by user and sum amounts
    const depositsByUser = new Map()
    topDeposits?.forEach((deposit: any) => {
      const userId = deposit.user_id
      const existing = depositsByUser.get(userId)
      if (existing) {
        existing.total_amount += deposit.amount
      } else {
        depositsByUser.set(userId, {
          user_id: userId,
          full_name: deposit.user_profiles.full_name,
          email: deposit.user_profiles.email,
          total_amount: deposit.amount
        })
      }
    })

    // Process withdrawals data - group by user and sum amounts
    const withdrawalsByUser = new Map()
    topWithdrawals?.forEach((withdrawal: any) => {
      const userId = withdrawal.user_id
      const existing = withdrawalsByUser.get(userId)
      if (existing) {
        existing.total_amount += withdrawal.amount
      } else {
        withdrawalsByUser.set(userId, {
          user_id: userId,
          full_name: withdrawal.user_profiles.full_name,
          email: withdrawal.user_profiles.email,
          total_amount: withdrawal.amount
        })
      }
    })

    // Convert to arrays and sort
    const depositRankings = Array.from(depositsByUser.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 50) // Top 50

    const withdrawalRankings = Array.from(withdrawalsByUser.values())
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 50) // Top 50

    const referralRankings = topReferrals
      ?.filter(user => user.referral_count > 0)
      .slice(0, 50) // Top 50

    return NextResponse.json({
      deposits: depositRankings,
      withdrawals: withdrawalRankings,
      referrals: referralRankings
    })

  } catch (error) {
    console.error('Rankings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
