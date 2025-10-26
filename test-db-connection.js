// Test Supabase database connection
// Run this with: node test-db-connection.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')
  
  try {
    // Test 1: Check if we can connect to the database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Test 2: Check if user_profiles table has email column
    const { data: columns, error: columnError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (columnError) {
      console.error('❌ Could not check table structure:', columnError.message)
      return
    }
    
    if (columns && columns.length > 0) {
      const hasEmail = 'email' in columns[0]
      console.log(hasEmail ? '✅ Email column exists' : '❌ Email column missing')
      console.log('Available columns:', Object.keys(columns[0]))
    } else {
      console.log('⚠️  No data in user_profiles table to check structure')
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
  }
}

testConnection()
