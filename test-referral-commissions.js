#!/usr/bin/env node

/**
 * Referral Commission System Test Script
 * 
 * This script:
 * 1. Creates 3 test users (L1 referrer, L2 referrer, L3 referrer)
 * 2. Sets up referral chain: L3 -> L2 -> L1
 * 3. Creates deposits and approves them
 * 4. Creates investments and completes them
 * 5. Verifies commissions are calculated correctly
 */

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test data
let testUsers = []
let testDeposits = []
let testInvestments = []

const generateRandomEmail = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`
const generateRandomPassword = () => crypto.randomBytes(16).toString('hex')

async function createTestUser(email, password) {
  try {
    console.log(`\n📝 Creating user: ${email}`)
    
    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `Test User ${testUsers.length + 1}`
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No user returned from signup')

    const userId = authData.user.id

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: `Test User ${testUsers.length + 1}`,
        email: email,
        balance: 100000, // Start with 100k balance
        referral_code: `TEST${Date.now()}${testUsers.length}`
      })
      .select()
      .single()

    if (profileError) throw profileError

    console.log(`✅ User created: ${userId}`)
    return { userId, email, password, referralCode: profileData.referral_code }
  } catch (error) {
    console.error(`❌ Error creating user: ${error.message}`)
    throw error
  }
}

async function setupReferralChain() {
  try {
    console.log('\n🔗 Setting up referral chain...')
    
    // Create L1 referrer (top of chain)
    const l1User = await createTestUser(generateRandomEmail(), generateRandomPassword())
    testUsers.push(l1User)

    // Create L2 referrer (referred by L1)
    const l2User = await createTestUser(generateRandomEmail(), generateRandomPassword())
    testUsers.push(l2User)

    // Update L2 to be referred by L1
    const { error: l2Error } = await supabase
      .from('user_profiles')
      .update({ referred_by: l1User.userId })
      .eq('id', l2User.userId)

    if (l2Error) throw l2Error
    console.log(`✅ L2 referred by L1`)

    // Create L3 referrer (referred by L2)
    const l3User = await createTestUser(generateRandomEmail(), generateRandomPassword())
    testUsers.push(l3User)

    // Update L3 to be referred by L2
    const { error: l3Error } = await supabase
      .from('user_profiles')
      .update({ referred_by: l2User.userId })
      .eq('id', l3User.userId)

    if (l3Error) throw l3Error
    console.log(`✅ L3 referred by L2`)

    console.log('\n📊 Referral Chain:')
    console.log(`L1 (${l1User.email}) -> L2 (${l2User.email}) -> L3 (${l3User.email})`)
  } catch (error) {
    console.error(`❌ Error setting up referral chain: ${error.message}`)
    throw error
  }
}

async function createDeposit(userId, amount) {
  try {
    console.log(`\n💰 Creating deposit for user: ${amount} PKR`)
    
    const { data: depositData, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        deposit_type: 'bank',
        amount_pkr: amount,
        sender_name: 'Test Sender',
        sender_account_last4: '1234',
        proof_url: 'https://example.com/proof.jpg',
        status: 'pending'
      })
      .select()
      .single()

    if (depositError) throw depositError
    console.log(`✅ Deposit created: ${depositData.id}`)
    return depositData
  } catch (error) {
    console.error(`❌ Error creating deposit: ${error.message}`)
    throw error
  }
}

async function approveDeposit(depositId, amount) {
  try {
    console.log(`\n✅ Approving deposit: ${depositId}`)
    
    // Update deposit status
    const { error: updateError } = await supabase
      .from('deposits')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString()
      })
      .eq('id', depositId)

    if (updateError) throw updateError

    // Get deposit details
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single()

    if (fetchError) throw fetchError

    // Update user balance
    const { error: balanceError } = await supabase.rpc('increment_user_balance', {
      user_id: deposit.user_id,
      amount: amount
    })

    if (balanceError) throw balanceError
    console.log(`✅ Deposit approved and balance updated`)
  } catch (error) {
    console.error(`❌ Error approving deposit: ${error.message}`)
    throw error
  }
}

async function createInvestment(userId, planId, amount) {
  try {
    console.log(`\n📈 Creating investment: ${amount} PKR on plan ${planId}`)
    
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7) // 7 day plan

    const { data: investmentData, error: investmentError } = await supabase
      .from('investments')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount_invested: amount,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      .select()
      .single()

    if (investmentError) throw investmentError
    console.log(`✅ Investment created: ${investmentData.id}`)
    return investmentData
  } catch (error) {
    console.error(`❌ Error creating investment: ${error.message}`)
    throw error
  }
}

async function completeInvestment(investmentId) {
  try {
    console.log(`\n🎯 Completing investment: ${investmentId}`)
    
    const { error: updateError } = await supabase
      .from('investments')
      .update({
        status: 'completed',
        last_income_collection_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', investmentId)

    if (updateError) throw updateError
    console.log(`✅ Investment completed`)
  } catch (error) {
    console.error(`❌ Error completing investment: ${error.message}`)
    throw error
  }
}

async function checkCommissions() {
  try {
    console.log(`\n📊 Checking commissions...`)
    
    // Get all commissions for test users
    const userIds = testUsers.map(u => u.userId)
    
    const { data: commissions, error: commissionError } = await supabase
      .from('referral_commissions')
      .select('*')
      .in('referrer_id', userIds)
      .order('created_at', { ascending: false })

    if (commissionError) throw commissionError

    console.log(`\n💵 Commission Summary:`)
    console.log(`Total commissions: ${commissions.length}`)

    // Group by type
    const depositComms = commissions.filter(c => c.commission_type === 'deposit')
    const earningComms = commissions.filter(c => c.commission_type === 'earning')

    console.log(`\n📥 Deposit Commissions: ${depositComms.length}`)
    depositComms.forEach(c => {
      const referrer = testUsers.find(u => u.userId === c.referrer_id)
      console.log(`  L${c.level}: ${c.amount} PKR (${c.commission_rate}%) - ${referrer?.email}`)
    })

    console.log(`\n📈 Earning Commissions: ${earningComms.length}`)
    earningComms.forEach(c => {
      const referrer = testUsers.find(u => u.userId === c.referrer_id)
      console.log(`  L${c.level}: ${c.amount} PKR (${c.commission_rate}%) - ${referrer?.email}`)
    })

    // Check user balances
    console.log(`\n💰 User Balances:`)
    for (const user of testUsers) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('balance')
        .eq('id', user.userId)
        .single()

      if (!profileError && profile) {
        console.log(`  ${user.email}: ${profile.balance} PKR`)
      }
    }

    return { depositComms, earningComms }
  } catch (error) {
    console.error(`❌ Error checking commissions: ${error.message}`)
    throw error
  }
}

async function cleanup() {
  try {
    console.log(`\n🧹 Cleaning up test data...`)
    
    // Delete commissions
    const userIds = testUsers.map(u => u.userId)
    await supabase
      .from('referral_commissions')
      .delete()
      .in('referrer_id', userIds)

    // Delete investments
    await supabase
      .from('investments')
      .delete()
      .in('user_id', userIds)

    // Delete deposits
    await supabase
      .from('deposits')
      .delete()
      .in('user_id', userIds)

    // Delete user profiles
    await supabase
      .from('user_profiles')
      .delete()
      .in('id', userIds)

    console.log(`✅ Test data cleaned up`)
  } catch (error) {
    console.error(`❌ Error cleaning up: ${error.message}`)
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Referral Commission System Tests\n')
    console.log('=' .repeat(60))

    // Step 1: Setup referral chain
    await setupReferralChain()

    // Step 2: Get a plan (assuming plan ID 1 exists)
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(1)

    if (plansError || !plans || plans.length === 0) {
      throw new Error('No plans found. Please create a plan first.')
    }

    const planId = plans[0].id
    console.log(`\n📋 Using plan: ${plans[0].name} (ID: ${planId})`)

    // Step 3: Create and approve deposits for L3 user
    console.log('\n' + '='.repeat(60))
    console.log('TESTING DEPOSIT COMMISSIONS (L1 Only)')
    console.log('='.repeat(60))

    const l3User = testUsers[2]
    const depositAmount = 10000

    const deposit = await createDeposit(l3User.userId, depositAmount)
    testDeposits.push(deposit)

    await approveDeposit(deposit.id, depositAmount)

    // Step 4: Check deposit commissions
    let { depositComms, earningComms } = await checkCommissions()

    if (depositComms.length > 0) {
      console.log(`\n✅ Deposit commissions created: ${depositComms.length}`)
      console.log('✅ Verifying only L1 got deposit commission...')
      const l1DepositComms = depositComms.filter(c => c.level === 1)
      const l2DepositComms = depositComms.filter(c => c.level === 2)
      const l3DepositComms = depositComms.filter(c => c.level === 3)
      
      if (l1DepositComms.length > 0 && l2DepositComms.length === 0 && l3DepositComms.length === 0) {
        console.log('✅ CORRECT: Only L1 received deposit commission')
      } else {
        console.log('❌ ERROR: L2 or L3 received deposit commission (they should not)')
      }
    } else {
      console.log('⚠️  No deposit commissions created (rates might be 0%)')
    }

    // Step 5: Create and complete investment
    console.log('\n' + '='.repeat(60))
    console.log('TESTING EARNING COMMISSIONS (All Levels)')
    console.log('='.repeat(60))

    const investment = await createInvestment(l3User.userId, planId, 5000)
    testInvestments.push(investment)

    await completeInvestment(investment.id)

    // Step 6: Check earning commissions
    ({ depositComms, earningComms } = await checkCommissions())

    if (earningComms.length > 0) {
      console.log(`\n✅ Earning commissions created: ${earningComms.length}`)
      console.log('✅ Verifying all levels got earning commission...')
      const l1EarningComms = earningComms.filter(c => c.level === 1)
      const l2EarningComms = earningComms.filter(c => c.level === 2)
      const l3EarningComms = earningComms.filter(c => c.level === 3)
      
      if (l1EarningComms.length > 0 && l2EarningComms.length > 0 && l3EarningComms.length > 0) {
        console.log('✅ CORRECT: All levels (L1, L2, L3) received earning commission')
      } else {
        console.log('❌ ERROR: Not all levels received earning commission')
        console.log(`  L1: ${l1EarningComms.length}, L2: ${l2EarningComms.length}, L3: ${l3EarningComms.length}`)
      }
    } else {
      console.log('⚠️  No earning commissions created (rates might be 0%)')
    }

    // Step 7: Final summary
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Commissions: ${depositComms.length + earningComms.length}`)
    console.log(`  - Deposit: ${depositComms.length}`)
    console.log(`  - Earning: ${earningComms.length}`)

    // Cleanup
    await cleanup()

    console.log('\n✅ All tests completed!')

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`)
    console.error(error)
    await cleanup()
    process.exit(1)
  }
}

// Run tests
runTests()
