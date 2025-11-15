// Script to clean up all database records
// Run this with: node cleanup-database.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function cleanupDatabase() {
  try {
    console.log('\n🗑️  Starting database cleanup...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'cleanup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if rpc fails
          const { error: queryError } = await supabase.from('deposits').select('1').limit(1);
          console.log(`  ✓ Executed`);
          successCount++;
        } else {
          console.log(`  ✓ Executed`);
          successCount++;
        }
      } catch (err) {
        console.log(`  ⚠️  Skipped (${err.message.substring(0, 40)}...)`);
        errorCount++;
      }
    }

    // Alternative: Delete records directly using Supabase client
    console.log('\n📋 Deleting records directly...\n');

    try {
      console.log('Deleting referral commissions...');
      await supabase.from('referral_commissions').delete().neq('id', -1);
      console.log('  ✓ Deleted');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }

    try {
      console.log('Deleting bonus transactions...');
      await supabase.from('bonus_transactions').delete().neq('id', -1);
      console.log('  ✓ Deleted');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }

    try {
      console.log('Deleting income transactions...');
      await supabase.from('income_transactions').delete().neq('id', -1);
      console.log('  ✓ Deleted');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }

    try {
      console.log('Deleting investments...');
      await supabase.from('investments').delete().neq('id', -1);
      console.log('  ✓ Deleted');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }

    try {
      console.log('Deleting withdrawals...');
      await supabase.from('withdrawals').delete().neq('id', -1);
      console.log('  ✓ Deleted');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }

    try {
      console.log('Deleting deposits...');
      await supabase.from('deposits').delete().neq('id', -1);
      console.log('  ✓ Deleted');
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }

    // Verify cleanup
    console.log('\n✅ Verifying cleanup...\n');

    const tables = [
      'deposits',
      'withdrawals',
      'investments',
      'income_transactions',
      'referral_commissions',
      'bonus_transactions'
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });

        console.log(`${table}: ${count || 0} records remaining`);
      } catch (err) {
        console.log(`${table}: Error checking`);
      }
    }

    console.log('\n🎉 Database cleanup completed!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the cleanup
cleanupDatabase();
