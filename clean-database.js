// Clean Database for Production Launch
// This removes ALL test data and prepares for real users

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanDatabase() {
  try {
    console.log('🧹 Cleaning Database for Production Launch...\n')

    // Step 1: Show what will be deleted
    console.log('1️⃣ Checking current data...')
    
    const tables = [
      'user_profiles',
      'investments', 
      'deposits',
      'withdrawals',
      'income_transactions',
      'referral_commissions'
    ]

    const counts = {}
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      counts[table] = count || 0
    }

    console.log('📊 Current Data:')
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`)
    })

    // Check admin users
    const { data: adminUsers } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, user_level, balance, earned_balance')
      .gte('user_level', 999)

    console.log('\n👑 Admin Users (will be kept):')
    if (adminUsers && adminUsers.length > 0) {
      adminUsers.forEach(user => {
        console.log(`   ${user.full_name} (${user.email}) - Level ${user.user_level}`)
        console.log(`     Balance: ${user.balance} PKR, Earned: ${user.earned_balance} PKR`)
      })
    } else {
      console.log('   ⚠️ No admin users found!')
    }

    // Step 2: Confirm deletion
    console.log('\n⚠️ WARNING: This will delete ALL test data!')
    console.log('📋 What will be deleted:')
    console.log('   ❌ All test users (user_level < 999)')
    console.log('   ❌ All investments')
    console.log('   ❌ All deposits')
    console.log('   ❌ All withdrawals')
    console.log('   ❌ All income transactions')
    console.log('   ❌ All referral commissions')
    console.log('   ✅ Admin users will be kept')
    console.log('   ✅ Plans will be kept')
    console.log('   ✅ Settings will be kept')

    // For safety, require manual confirmation
    console.log('\n🔒 SAFETY CHECK:')
    console.log('To proceed, you must manually uncomment the deletion code below.')
    console.log('This prevents accidental data loss.')

    // UNCOMMENT THIS SECTION TO ACTUALLY CLEAN THE DATABASE
    console.log('\n🔴 READY TO CLEAN - Uncomment the code below to proceed')
    console.log('⚠️  LAST CHANCE - Make sure you want to delete all test data!')
    
    /*
    console.log('\n🗑️ Starting cleanup...')

    // Delete in correct order (foreign key constraints)
    console.log('Deleting income transactions...')
    const { error: e1 } = await supabase.from('income_transactions').delete().neq('id', 0)
    if (e1) console.error('Error:', e1.message)

    console.log('Deleting referral commissions...')
    const { error: e2 } = await supabase.from('referral_commissions').delete().neq('id', 0)
    if (e2) console.error('Error:', e2.message)

    console.log('Deleting investments...')
    const { error: e3 } = await supabase.from('investments').delete().neq('id', 0)
    if (e3) console.error('Error:', e3.message)

    console.log('Deleting withdrawals...')
    const { error: e4 } = await supabase.from('withdrawals').delete().neq('id', 0)
    if (e4) console.error('Error:', e4.message)

    console.log('Deleting deposits...')
    const { error: e5 } = await supabase.from('deposits').delete().neq('id', 0)
    if (e5) console.error('Error:', e5.message)

    console.log('Resetting admin user balances...')
    const { error: e6 } = await supabase
      .from('user_profiles')
      .update({ 
        balance: 0, 
        earned_balance: 0,
        total_deposits: 0,
        total_withdrawals: 0
      })
      .gte('user_level', 999)
    if (e6) console.error('Error:', e6.message)

    console.log('Deleting test users...')
    const { error: e7 } = await supabase
      .from('user_profiles')
      .delete()
      .lt('user_level', 999)
    if (e7) console.error('Error:', e7.message)

    console.log('\n✅ Database cleaned successfully!')
    
    // Verify clean state
    console.log('\n🔍 Verifying clean state...')
    const newCounts = {}
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      newCounts[table] = count || 0
    }

    console.log('📊 After Cleanup:')
    Object.entries(newCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`)
    })

    const { data: remainingUsers } = await supabase
      .from('user_profiles')
      .select('full_name, user_level')

    console.log('\n👥 Remaining Users:')
    if (remainingUsers && remainingUsers.length > 0) {
      remainingUsers.forEach(user => {
        console.log(`   ${user.full_name} (Level ${user.user_level})`)
      })
    } else {
      console.log('   No users remaining')
    }

    console.log('\n🚀🚀🚀 DATABASE READY FOR PRODUCTION! 🚀🚀🚀')
    console.log('\nNext steps:')
    console.log('1. Run: npm run build')
    console.log('2. Test the build locally')
    console.log('3. Deploy to production')
    console.log('4. Monitor first real users closely')
    */

    console.log('\n⚠️ CLEANUP NOT EXECUTED - Uncomment the code above to proceed')
    console.log('This is a safety measure to prevent accidental data loss.')

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    console.error(error)
  }
}

cleanDatabase()
