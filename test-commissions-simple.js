#!/usr/bin/env node

/**
 * Simple Referral Commission Test
 * Run this after setting commission rates to 5%, 5%, 3%, 2%
 */

const { createClient } = require('@supabase/supabase-js')

// Get credentials from command line arguments or environment
const supabaseUrl = process.argv[2] || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.argv[3] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log(`
❌ Missing Supabase credentials!

Usage:
  node test-commissions-simple.js <SUPABASE_URL> <SUPABASE_ANON_KEY>

Or set environment variables:
  NEXT_PUBLIC_SUPABASE_URL=your_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

You can find these in:
  1. Supabase Dashboard → Project Settings → API
  2. Or check your .env.local file
  `)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCommissionRates() {
  try {
    console.log('📊 Checking current commission rates...\n')
    
    const { data, error } = await supabase
      .from('admin_settings')
      .select('referral_l1_deposit_percent, referral_l1_percent, referral_l2_percent, referral_l3_percent')
      .eq('id', 1)
      .single()

    if (error) throw error

    console.log('Current Commission Rates:')
    console.log(`  L1 Deposit Commission: ${data.referral_l1_deposit_percent}%`)
    console.log(`  L1 Earning Commission: ${data.referral_l1_percent}%`)
    console.log(`  L2 Earning Commission: ${data.referral_l2_percent}%`)
    console.log(`  L3 Earning Commission: ${data.referral_l3_percent}%`)
    
    return data
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

async function checkRecentCommissions() {
  try {
    console.log('\n📋 Recent Commissions (Last 20):\n')
    
    const { data, error } = await supabase
      .from('referral_commissions')
      .select(`
        id,
        referrer_id,
        referred_user_id,
        commission_type,
        level,
        amount,
        commission_rate,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    if (data.length === 0) {
      console.log('No commissions found yet.')
      return
    }

    // Group by type
    const depositComms = data.filter(c => c.commission_type === 'deposit')
    const earningComms = data.filter(c => c.commission_type === 'earning')

    console.log(`📥 Deposit Commissions: ${depositComms.length}`)
    depositComms.forEach((c, i) => {
      console.log(`  ${i + 1}. L${c.level}: ${c.amount} PKR (${c.commission_rate}%) - ${new Date(c.created_at).toLocaleString()}`)
    })

    console.log(`\n📈 Earning Commissions: ${earningComms.length}`)
    earningComms.forEach((c, i) => {
      console.log(`  ${i + 1}. L${c.level}: ${c.amount} PKR (${c.commission_rate}%) - ${new Date(c.created_at).toLocaleString()}`)
    })

    // Verify correct distribution
    console.log('\n✅ Verification:')
    const l1DepositComms = depositComms.filter(c => c.level === 1)
    const l2DepositComms = depositComms.filter(c => c.level === 2)
    const l3DepositComms = depositComms.filter(c => c.level === 3)

    if (l1DepositComms.length > 0 && l2DepositComms.length === 0 && l3DepositComms.length === 0) {
      console.log('  ✅ CORRECT: Only L1 receives deposit commissions')
    } else if (depositComms.length === 0) {
      console.log('  ⚠️  No deposit commissions yet')
    } else {
      console.log('  ❌ ERROR: L2 or L3 received deposit commission (they should not)')
    }

    const l1EarningComms = earningComms.filter(c => c.level === 1)
    const l2EarningComms = earningComms.filter(c => c.level === 2)
    const l3EarningComms = earningComms.filter(c => c.level === 3)

    if (l1EarningComms.length > 0 && l2EarningComms.length > 0 && l3EarningComms.length > 0) {
      console.log('  ✅ CORRECT: All levels (L1, L2, L3) receive earning commissions')
    } else if (earningComms.length === 0) {
      console.log('  ⚠️  No earning commissions yet')
    } else {
      console.log('  ⚠️  Not all levels have earning commissions yet')
      console.log(`    L1: ${l1EarningComms.length}, L2: ${l2EarningComms.length}, L3: ${l3EarningComms.length}`)
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Referral Commission System Status Check\n')
  console.log('='.repeat(60))
  
  await checkCommissionRates()
  await checkRecentCommissions()
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Status check complete!')
}

main()
