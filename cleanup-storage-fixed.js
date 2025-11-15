// Script to delete all deposit proof pictures from Supabase storage
// Run this with: node cleanup-storage-fixed.js

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

async function cleanupDepositProofs() {
  try {
    console.log('\n🗑️  Starting cleanup of deposit proof pictures...\n');

    // List all files in the deposit-proofs bucket
    const { data: files, error: listError } = await supabase.storage
      .from('deposit-proofs')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('❌ Error listing files:', listError.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('✅ No files found in deposit-proofs bucket (already clean!)');
      return;
    }

    console.log(`Found ${files.length} files to delete:`);
    files.forEach(file => console.log(`  - ${file.name}`));

    // Delete all files
    const fileNames = files.map(file => file.name);
    
    const { error: deleteError } = await supabase.storage
      .from('deposit-proofs')
      .remove(fileNames);

    if (deleteError) {
      console.error('❌ Error deleting files:', deleteError.message);
      return;
    }

    console.log(`\n✅ Successfully deleted ${fileNames.length} deposit proof pictures!`);
    console.log('🎉 Storage cleanup completed!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the cleanup
cleanupDepositProofs();
