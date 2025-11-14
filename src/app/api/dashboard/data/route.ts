import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

// Optimized endpoint that fetches all dashboard data in parallel
export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auto-update expired investments first
    const now = new Date()
    await supabase
      .from('investments')
      .update({ status: 'completed' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('end_date', now.toISOString())

    // Fetch all data in parallel for maximum performance
    const [
      investmentsResult,
      completedInvestmentsResult,
      profileResult,
      earningsResult
    ] = await Promise.allSettled([
      // Active investments
      supabase
        .from('investments')
        .select(`
          *,
          plans (
            name,
            duration_days,
            profit_percent,
            capital_return
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Completed investments
      supabase
        .from('investments')
        .select(`
          *,
          plans (
            name,
            duration_days,
            profit_percent,
            capital_return
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'expired'])
        .order('created_at', { ascending: false }),

      // User profile
      supabase
        .from('user_profiles')
        .select('id, full_name, balance, earned_balance, user_level, referral_code, referred_by')
        .eq('id', user.id)
        .single(),

      // Earnings stats
      supabase
        .from('income_transactions')
        .select('amount, created_at')
        .eq('user_id', user.id)
    ])

    // Process results
    const investments = investmentsResult.status === 'fulfilled' ? investmentsResult.value.data || [] : []
    const completedInvestments = completedInvestmentsResult.status === 'fulfilled' ? completedInvestmentsResult.value.data || [] : []
    const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null
    const incomeData = earningsResult.status === 'fulfilled' ? earningsResult.value.data || [] : []

    // Calculate stats
    const stats = investments.reduce(
      (acc, investment) => {
        acc.totalInvested += investment.amount_invested
        
        if (investment.status === 'active') {
          acc.activeInvestments += 1
        } else if (investment.status === 'completed') {
          acc.completedInvestments += 1
          const earnings = (investment.amount_invested * investment.plans.profit_percent) / 100
          acc.totalEarnings += earnings
        }
        
        return acc
      },
      { totalInvested: 0, activeInvestments: 0, completedInvestments: 0, totalEarnings: 0 }
    )

    // Calculate earnings stats
    let todayEarnings = 0
    let yesterdayEarnings = 0
    let totalExpiredEarnings = 0

    if (incomeData.length > 0) {
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const yesterday = new Date(today)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      incomeData.forEach(income => {
        const amount = income.amount
        const incomeDate = new Date(income.created_at)
        
        if (incomeDate >= today && incomeDate < tomorrow) {
          todayEarnings += amount
        } else if (incomeDate >= yesterday && incomeDate < today) {
          yesterdayEarnings += amount
        }
        
        totalExpiredEarnings += amount
      })
    }

    const earningsStats = {
      todayEarnings,
      yesterdayEarnings,
      totalExpiredEarnings
    }

    // Return all data in a single response
    return NextResponse.json({
      success: true,
      data: {
        investments,
        completedInvestments,
        profile,
        stats,
        earningsStats
      },
      timestamp: now.toISOString()
    })

  } catch (error: any) {
    console.error('Dashboard data API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Enable caching for better performance
export const revalidate = 60 // Cache for 1 minute
