// Setup Test Investment for Final Collection Testing
// This creates a test scenario where investment is ready for final collection

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TEST_USER_ID = 'ca38355f-d402-4ba0-b5be-08013d6d3945'
const TEST_INVESTMENT_ID = 31

async function setupTestInvestment() {
  try {
    console.log('🚀 Setting up test investment...\n')

    // Step 1: Check if user exists
    console.log('1️⃣ Checking user...')
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', TEST_USER_ID)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', TEST_USER_ID)
      console.log('Please create this user first or use a different user ID')
      return
    }
    console.log(`✅ User found: ${user.full_name || user.email}`)
    console.log(`   Current balance: ${user.balance} PKR`)
    console.log(`   Earned balance: ${user.earned_balance} PKR\n`)

    // Step 2: Check if investment exists
    console.log('2️⃣ Checking investment...')
    const { data: investment, error: invError } = await supabase
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
      .eq('id', TEST_INVESTMENT_ID)
      .eq('user_id', TEST_USER_ID)
      .single()

    if (invError || !investment) {
      console.error('❌ Investment not found:', TEST_INVESTMENT_ID)
      console.log('Creating new investment...\n')
      
      // Get a plan (7-day plan with 14% ROI)
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('duration_days', 7)
        .single()

      if (!plan) {
        console.error('❌ No 7-day plan found. Please create one first.')
        return
      }

      // Create investment
      const { data: newInvestment, error: createError } = await supabase
        .from('investments')
        .insert({
          id: TEST_INVESTMENT_ID,
          user_id: TEST_USER_ID,
          plan_id: plan.id,
          amount_invested: 2000,
          status: 'active',
          start_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
          last_income_collection_date: null,
          total_days_collected: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create investment:', createError.message)
        return
      }

      console.log('✅ Investment created!')
      console.log(`   Amount: ${newInvestment.amount_invested} PKR`)
      console.log(`   Plan: 7 days, 14% ROI`)
      console.log(`   Started: 6 days ago\n`)

    } else {
      console.log('✅ Investment found!')
      console.log(`   Amount: ${investment.amount_invested} PKR`)
      console.log(`   Plan: ${investment.plans.name}`)
      console.log(`   Duration: ${investment.plans.duration_days} days`)
      console.log(`   Profit: ${investment.plans.profit_percent}%`)
      console.log(`   Status: ${investment.status}`)
      console.log(`   Days collected: ${investment.total_days_collected || 0}\n`)

      // Step 3: Update investment to be ready for final collection
      console.log('3️⃣ Setting up for final collection...')
      
      // Calculate: Started 6 days ago, collected 6 days, now ready for day 7 (final)
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      
      const { error: updateError } = await supabase
        .from('investments')
        .update({
          start_date: sixDaysAgo.toISOString(),
          last_income_collection_date: sixDaysAgo.toISOString(),
          total_days_collected: 6, // Collected 6 days already
          status: 'active'
        })
        .eq('id', TEST_INVESTMENT_ID)

      if (updateError) {
        console.error('❌ Failed to update investment:', updateError.message)
        return
      }

      console.log('✅ Investment updated!')
      console.log(`   Start date: 6 days ago`)
      console.log(`   Last collection: 6 days ago`)
      console.log(`   Days collected: 6/7`)
      console.log(`   Ready for: FINAL COLLECTION (Day 7)\n`)
    }

    // Step 4: Calculate expected results
    console.log('4️⃣ Expected Results:')
    const amount = investment?.amount_invested || 2000
    const profitPercent = investment?.plans?.profit_percent || 14
    const totalProfit = (amount * profitPercent) / 100
    const profitPerDay = totalProfit / 7
    const finalDayProfit = profitPerDay * 1 // Only day 7 remaining

    console.log(`   Investment: ${amount} PKR`)
    console.log(`   Total profit (7 days): ${totalProfit} PKR`)
    console.log(`   Profit per day: ${profitPerDay.toFixed(2)} PKR`)
    console.log(`   Final day profit: ${finalDayProfit.toFixed(2)} PKR`)
    console.log(`   Capital return: ${amount} PKR`)
    console.log(`   `)
    console.log(`   📊 EXPECTED FINAL BALANCE:`)
    console.log(`   Current balance: ${user.balance} PKR`)
    console.log(`   + Capital: ${amount} PKR`)
    console.log(`   + Final profit: ${finalDayProfit.toFixed(2)} PKR`)
    console.log(`   = Total: ${(parseFloat(user.balance) + amount + finalDayProfit).toFixed(2)} PKR`)
    console.log(`   `)
    console.log(`   ⚠️  If you get MORE than this, the bug still exists!`)
    console.log(`   ✅ If you get EXACTLY this, the bug is fixed!\n`)

    console.log('🎯 TEST INSTRUCTIONS:')
    console.log('1. Login with user ID:', TEST_USER_ID)
    console.log('2. Go to "My Investments" page')
    console.log('3. Click "Collect Income" on investment #31')
    console.log('4. Check your balance matches the expected amount above')
    console.log('5. If balance is correct, bug is FIXED! ✅')
    console.log('6. If balance is higher, bug still EXISTS! ❌\n')

    console.log('✅ Setup complete! Ready to test on website.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  }
}

setupTestInvestment()
