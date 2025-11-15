// Simple Referral Test - Uses existing users
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testReferralSystem() {
  try {
    console.log('🧪 Testing Referral Commission System...\n')

    // Step 1: Check existing users
    console.log('1️⃣ Checking existing users...')
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, referred_by, balance, earned_balance')
      .order('created_at', { ascending: true })

    if (!users || users.length < 2) {
      console.log('❌ Need at least 2 users to test referrals')
      console.log('Please create some test users first')
      return
    }

    console.log('👥 Available users:')
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email})`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Referred by: ${user.referred_by || 'None'}`)
      console.log(`      Balance: ${user.balance} PKR\n`)
    })

    // Use first user as referrer, second as new user
    const referrer = users[0]
    const newUser = users[1]

    console.log(`📋 Test Setup:`)
    console.log(`   Referrer: ${referrer.full_name}`)
    console.log(`   New User: ${newUser.full_name}`)

    // Step 2: Set up referral relationship
    console.log('\n2️⃣ Setting up referral relationship...')
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUser.id)

    if (updateError) {
      console.error('❌ Failed to set referral:', updateError.message)
      return
    }
    console.log('✅ Referral relationship set up')

    // Step 3: Test deposit commission
    console.log('\n3️⃣ Testing deposit commission...')
    
    const depositAmount = 1000
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert({
        user_id: newUser.id,
        amount_pkr: depositAmount,
        deposit_type: 'usdt',
        status: 'approved'
      })
      .select()
      .single()

    if (depositError) {
      console.error('❌ Failed to create deposit:', depositError.message)
      return
    }

    console.log(`✅ Test deposit created: ${depositAmount} PKR`)

    // Update user balance
    await supabase
      .from('user_profiles')
      .update({ balance: depositAmount })
      .eq('id', newUser.id)

    // Trigger deposit commissions
    const { data: commissionResult, error: commissionError } = await supabase.rpc('process_deposit_commissions', {
      user_id_param: newUser.id,
      deposit_amount_param: depositAmount
    })

    if (commissionError) {
      console.error('❌ Deposit commission failed:', commissionError.message)
      console.log('   This might be expected if the function doesn\'t exist')
    } else {
      console.log('✅ Deposit commissions processed:', commissionResult)
    }

    // Step 4: Check commissions
    console.log('\n4️⃣ Checking commissions...')
    
    const { data: commissions } = await supabase
      .from('referral_commissions')
      .select(`
        *,
        referrer:referrer_id(full_name),
        referred:referred_user_id(full_name)
      `)
      .eq('referred_user_id', newUser.id)

    console.log('📊 Commissions found:')
    if (commissions && commissions.length > 0) {
      commissions.forEach(comm => {
        console.log(`   ${comm.commission_type}: ${comm.referrer.full_name} got ${comm.amount} PKR (Level ${comm.level})`)
      })
      console.log('\n✅ Referral commissions are working!')
    } else {
      console.log('   ❌ No commissions found')
      console.log('   This could mean:')
      console.log('   - Commission functions are not working')
      console.log('   - Commission rates are set to 0')
      console.log('   - There\'s an issue with the referral system')
    }

    // Step 5: Check referrer balance
    console.log('\n5️⃣ Checking referrer balance...')
    const { data: updatedReferrer } = await supabase
      .from('user_profiles')
      .select('balance, earned_balance')
      .eq('id', referrer.id)
      .single()

    if (updatedReferrer) {
      const balanceIncrease = updatedReferrer.balance - referrer.balance
      const earnedIncrease = updatedReferrer.earned_balance - referrer.earned_balance
      
      console.log(`   Before: Balance=${referrer.balance}, Earned=${referrer.earned_balance}`)
      console.log(`   After:  Balance=${updatedReferrer.balance}, Earned=${updatedReferrer.earned_balance}`)
      console.log(`   Change: Balance=+${balanceIncrease}, Earned=+${earnedIncrease}`)
      
      if (balanceIncrease > 0 || earnedIncrease > 0) {
        console.log('✅ Referrer received commission!')
      } else {
        console.log('❌ Referrer did not receive commission')
      }
    }

    // Step 6: Test earning commission
    console.log('\n6️⃣ Testing earning commission...')
    
    // Get a plan
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .limit(1)
      .single()

    if (!plan) {
      console.log('❌ No plans found, skipping earning commission test')
    } else {
      // Create investment
      const investmentAmount = 500
      const { data: investment, error: invError } = await supabase
        .from('investments')
        .insert({
          user_id: newUser.id,
          plan_id: plan.id,
          amount_invested: investmentAmount,
          status: 'active',
          start_date: new Date().toISOString()
        })
        .select()
        .single()

      if (invError) {
        console.error('❌ Failed to create investment:', invError.message)
      } else {
        console.log(`✅ Test investment created: ${investmentAmount} PKR`)

        // Simulate income collection
        const { data: incomeResult, error: incomeError } = await supabase.rpc('collect_daily_income', {
          investment_id_param: investment.id,
          user_id_param: newUser.id
        })

        if (incomeError) {
          console.error('❌ Income collection failed:', incomeError.message)
        } else {
          console.log('✅ Income collected:', incomeResult)

          // Check for earning commissions
          const { data: earningCommissions } = await supabase
            .from('referral_commissions')
            .select('*')
            .eq('referred_user_id', newUser.id)
            .eq('commission_type', 'earning')

          if (earningCommissions && earningCommissions.length > 0) {
            console.log('✅ Earning commissions created!')
            earningCommissions.forEach(comm => {
              console.log(`   Level ${comm.level}: ${comm.amount} PKR`)
            })
          } else {
            console.log('❌ No earning commissions found')
          }
        }
      }
    }

    // Step 7: Summary
    console.log('\n📋 REFERRAL TEST SUMMARY:')
    
    const { data: allCommissions } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('referred_user_id', newUser.id)

    const depositComms = allCommissions?.filter(c => c.commission_type === 'deposit') || []
    const earningComms = allCommissions?.filter(c => c.commission_type === 'earning') || []

    console.log(`   Deposit commissions: ${depositComms.length}`)
    console.log(`   Earning commissions: ${earningComms.length}`)
    
    if (depositComms.length > 0 || earningComms.length > 0) {
      console.log('\n✅✅✅ REFERRAL SYSTEM IS WORKING! ✅✅✅')
    } else {
      console.log('\n❌❌❌ REFERRAL SYSTEM NEEDS ATTENTION! ❌❌❌')
      console.log('\nPossible issues:')
      console.log('- Commission functions not implemented')
      console.log('- Commission rates set to 0%')
      console.log('- Database triggers not working')
      console.log('- RLS policies blocking inserts')
    }

    console.log('\n🧹 Cleaning up test data...')
    
    // Clean up test data
    await supabase.from('referral_commissions').delete().eq('referred_user_id', newUser.id)
    await supabase.from('income_transactions').delete().eq('user_id', newUser.id)
    await supabase.from('investments').delete().eq('user_id', newUser.id)
    await supabase.from('deposits').delete().eq('user_id', newUser.id)
    
    // Reset user balances
    await supabase.from('user_profiles').update({ balance: 0, earned_balance: 0 }).eq('id', newUser.id)
    await supabase.from('user_profiles').update({ balance: referrer.balance, earned_balance: referrer.earned_balance }).eq('id', referrer.id)
    
    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  }
}

testReferralSystem()
