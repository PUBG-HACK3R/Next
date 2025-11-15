// Script to reset all user balances to 0
// Run this with: node cleanup-user-balance.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
console.log('Supabase Key:', supabaseKey ? '✓ Found' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing environment variables!');
  console.error('Make sure your .env.local file has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetUserBalances() {
  try {
    console.log('\n💰 Starting user balance reset...\n');

    // Get all users
    console.log('Fetching all users...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, full_name, balance, earned_balance');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('✅ No users found');
      return;
    }

    console.log(`Found ${users.length} users\n`);

    // Display current balances
    console.log('📊 Current balances:');
    let totalBalance = 0;
    let totalEarned = 0;
    
    users.forEach(user => {
      console.log(`  ${user.full_name}: Balance=${user.balance}, Earned=${user.earned_balance}`);
      totalBalance += user.balance || 0;
      totalEarned += user.earned_balance || 0;
    });

    console.log(`\n  Total Balance: ${totalBalance} PKR`);
    console.log(`  Total Earned: ${totalEarned} PKR\n`);

    // Reset all balances to 0
    console.log('🔄 Resetting all balances to 0...\n');

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        balance: 0,
        earned_balance: 0
      })
      .not('id', 'is', null);

    if (updateError) {
      console.error('❌ Error updating balances:', updateError.message);
      return;
    }

    console.log('✓ All balances reset to 0\n');

    // Verify reset
    console.log('✅ Verifying reset...\n');

    const { data: updatedUsers, error: verifyError } = await supabase
      .from('user_profiles')
      .select('id, full_name, balance, earned_balance');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
      return;
    }

    console.log('📊 Updated balances:');
    let newTotalBalance = 0;
    let newTotalEarned = 0;
    
    updatedUsers.forEach(user => {
      console.log(`  ${user.full_name}: Balance=${user.balance}, Earned=${user.earned_balance}`);
      newTotalBalance += user.balance || 0;
      newTotalEarned += user.earned_balance || 0;
    });

    console.log(`\n  Total Balance: ${newTotalBalance} PKR`);
    console.log(`  Total Earned: ${newTotalEarned} PKR\n`);

    console.log('🎉 User balance cleanup completed!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the cleanup
resetUserBalances();
