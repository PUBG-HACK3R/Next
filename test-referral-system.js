// Test Referral Commission System
// This tests L1, L2, L3 commissions for deposits and earnings

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test user IDs
const REFERRER_L1_ID = 'a1111111-1111-1111-1111-111111111111' // Level 1 referrer
const REFERRER_L2_ID = 'a2222222-2222-2222-2222-222222222222' // Level 2 referrer  
const REFERRER_L3_ID = 'a3333333-3333-3333-3333-333333333333' // Level 3 referrer
const NEW_USER_ID = 'a4444444-4444-4444-4444-444444444444'    // New user being referred

async function testReferralSystem() {
  try {
    console.log('🧪 Testing Referral Commission System...\n')

    // Step 1: Create test users
    console.log('1️⃣ Creating test users...')
    
    // Create users in correct order (referrers first)
    const testUsers = [
      { id: REFERRER_L3_ID, name: 'L3 Referrer', email: 'l3@test.com', level: 1 },
      { id: REFERRER_L2_ID, name: 'L2 Referrer', email: 'l2@test.com', level: 1, referred_by: REFERRER_L3_ID },
      { id: REFERRER_L1_ID, name: 'L1 Referrer', email: 'l1@test.com', level: 1, referred_by: REFERRER_L2_ID },
      { id: NEW_USER_ID, name: 'New User', email: 'newuser@test.com', level: 1, referred_by: REFERRER_L1_ID }
    ]

    // Delete existing test users first (reverse order)
    for (const user of [...testUsers].reverse()) {
      await supabase.from('user_profiles').delete().eq('id', user.id)
    }

    // Create users in correct order (referrers first)
    for (const user of testUsers) {
      const { error } = await supabase.from('user_profiles').insert({
        id: user.id,
        full_name: user.name,
        email: user.email,
        user_level: user.level,
        referred_by: user.referred_by,
        balance: 0,
        earned_balance: 0
      })

      if (error) {
        console.error(`❌ Failed to create ${user.name}:`, error.message)
        return
      }
    }
    
    console.log('✅ Test users created')
    console.log('   L3 → L2 → L1 → New User (referral chain)\n')

    // Step 2: Test deposit commission
    console.log('2️⃣ Testing deposit commission...')
    
    // Create a deposit for new user
    const depositAmount = 1000
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: NEW_USER_ID,
        amount_pkr: depositAmount,
        status: 'approved',
        payment_method: 'test',
        transaction_id: 'TEST_' + Date.now()
      })
      .select()
      .single()

    if (depositError) {
      console.error('❌ Failed to create deposit:', depositError.message)
      return
    }

    // Update user balance
    await supabase
      .from('user_profiles')
      .update({ balance: depositAmount })
      .eq('id', NEW_USER_ID)

    console.log(`✅ Deposit created: ${depositAmount} PKR`)

    // Trigger deposit commissions manually (since we're testing)
    const { error: commissionError } = await supabase.rpc('process_deposit_commissions', {
      user_id_param: NEW_USER_ID,
      deposit_amount_param: depositAmount
    })

    if (commissionError) {
      console.error('❌ Deposit commission failed:', commissionError.message)
    } else {
      console.log('✅ Deposit commissions processed')
    }

    // Check deposit commissions
    const { data: depositCommissions } = await supabase
      .from('referral_commissions')
      .select(`
        *,
        referrer:referrer_id(full_name),
        referred:referred_user_id(full_name)
      `)
      .eq('referred_user_id', NEW_USER_ID)
      .eq('commission_type', 'deposit')

    console.log('\n📊 Deposit Commissions:')
    if (depositCommissions && depositCommissions.length > 0) {
      depositCommissions.forEach(comm => {
        console.log(`   L${comm.level}: ${comm.referrer.full_name} got ${comm.amount} PKR`)
      })
    } else {
      console.log('   ❌ No deposit commissions found!')
    }

    // Step 3: Test earning commission
    console.log('\n3️⃣ Testing earning commission...')
    
    // Create investment for new user
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('duration_days', 7)
      .single()

    if (!plan) {
      console.error('❌ No 7-day plan found')
      return
    }

    const investmentAmount = 1000
    const { data: investment, error: invError } = await supabase
      .from('investments')
      .insert({
        user_id: NEW_USER_ID,
        plan_id: plan.id,
        amount_invested: investmentAmount,
        status: 'active',
        start_date: new Date().toISOString()
      })
      .select()
      .single()

    if (invError) {
      console.error('❌ Failed to create investment:', invError.message)
      return
    }

    console.log(`✅ Investment created: ${investmentAmount} PKR`)

    // Simulate collecting income (which triggers earning commissions)
    const profitAmount = 40 // One day's profit
    const { data: incomeResult, error: incomeError } = await supabase.rpc('collect_daily_income', {
      investment_id_param: investment.id,
      user_id_param: NEW_USER_ID
    })

    if (incomeError) {
      console.error('❌ Income collection failed:', incomeError.message)
    } else {
      console.log('✅ Income collected:', incomeResult)
    }

    // Check earning commissions
    const { data: earningCommissions } = await supabase
      .from('referral_commissions')
      .select(`
        *,
        referrer:referrer_id(full_name),
        referred:referred_user_id(full_name)
      `)
      .eq('referred_user_id', NEW_USER_ID)
      .eq('commission_type', 'earning')

    console.log('\n📊 Earning Commissions:')
    if (earningCommissions && earningCommissions.length > 0) {
      earningCommissions.forEach(comm => {
        console.log(`   L${comm.level}: ${comm.referrer.full_name} got ${comm.amount} PKR`)
      })
    } else {
      console.log('   ❌ No earning commissions found!')
    }

    // Step 4: Check referrer balances
    console.log('\n4️⃣ Checking referrer balances...')
    
    const referrerIds = [REFERRER_L1_ID, REFERRER_L2_ID, REFERRER_L3_ID]
    for (const id of referrerIds) {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('full_name, balance, earned_balance')
        .eq('id', id)
        .single()

      if (user) {
        console.log(`   ${user.full_name}: Balance=${user.balance} PKR, Earned=${user.earned_balance} PKR`)
      }
    }

    // Step 5: Summary
    console.log('\n📋 REFERRAL TEST SUMMARY:')
    
    const { data: allCommissions } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('referred_user_id', NEW_USER_ID)

    const depositComms = allCommissions?.filter(c => c.commission_type === 'deposit') || []
    const earningComms = allCommissions?.filter(c => c.commission_type === 'earning') || []

    console.log(`   Deposit commissions: ${depositComms.length} (expected: 3)`)
    console.log(`   Earning commissions: ${earningComms.length} (expected: 3)`)
    
    const totalDepositComm = depositComms.reduce((sum, c) => sum + parseFloat(c.amount), 0)
    const totalEarningComm = earningComms.reduce((sum, c) => sum + parseFloat(c.amount), 0)
    
    console.log(`   Total deposit commission: ${totalDepositComm} PKR`)
    console.log(`   Total earning commission: ${totalEarningComm} PKR`)

    if (depositComms.length === 3 && earningComms.length === 3) {
      console.log('\n✅✅✅ REFERRAL SYSTEM WORKING! ✅✅✅')
    } else {
      console.log('\n❌❌❌ REFERRAL SYSTEM HAS ISSUES! ❌❌❌')
    }

    console.log('\n🧹 Cleaning up test data...')
    
    // Clean up test data
    await supabase.from('referral_commissions').delete().eq('referred_user_id', NEW_USER_ID)
    await supabase.from('income_transactions').delete().eq('user_id', NEW_USER_ID)
    await supabase.from('investments').delete().eq('user_id', NEW_USER_ID)
    await supabase.from('deposits').delete().eq('user_id', NEW_USER_ID)
    
    for (const user of testUsers) {
      await supabase.from('user_profiles').delete().eq('id', user.id)
    }
    
    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  }
}

testReferralSystem()
