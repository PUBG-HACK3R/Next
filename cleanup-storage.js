// Script to delete all deposit proof pictures from Supabase storage
// Run this with: node cleanup-storage.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDepositProofs() {
  try {
    console.log('Starting cleanup of deposit proof pictures...');

    // List all files in the deposit-proofs bucket
    const { data: files, error: listError } = await supabase.storage
      .from('deposit-proofs')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('No files found in deposit-proofs bucket');
      return;
    }

    console.log(`Found ${files.length} files to delete`);

    // Delete all files
    const fileNames = files.map(file => file.name);
    
    const { error: deleteError } = await supabase.storage
      .from('deposit-proofs')
      .remove(fileNames);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${fileNames.length} deposit proof pictures`);
    console.log('Cleanup completed!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the cleanup
cleanupDepositProofs();
