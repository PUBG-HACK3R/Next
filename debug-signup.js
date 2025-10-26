// Debug Supabase signup issue
// Run with: node debug-signup.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Debugging Supabase Signup Issue')
console.log('================================')
console.log('URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.log('Make sure .env.local has:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSignup() {
  try {
    console.log('\n1️⃣ Testing database connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      return
    }
    console.log('✅ Database connection successful')
    
    console.log('\n2️⃣ Checking user_profiles table structure...')
    
    // Check table structure
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (profileError) {
      console.error('❌ Could not query user_profiles:', profileError.message)
      return
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Table structure:', Object.keys(profiles[0]))
      console.log('✅ Has email column:', 'email' in profiles[0])
      console.log('✅ Has referral_code column:', 'referral_code' in profiles[0])
    } else {
      console.log('⚠️  No existing users to check structure')
    }
    
    console.log('\n3️⃣ Testing signup process...')
    
    // Generate a unique test email
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpass123'
    const testName = 'Test User'
    
    console.log('📧 Test email:', testEmail)
    
    // Attempt signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined,
        data: {
          full_name: testName,
          referred_by: null,
        },
      },
    })
    
    if (signupError) {
      console.error('❌ Signup failed:', signupError.message)
      console.error('Error code:', signupError.status)
      console.error('Full error:', JSON.stringify(signupError, null, 2))
      
      // Check if it's a trigger error
      if (signupError.message.includes('Database error')) {
        console.log('\n🔍 This looks like a trigger error. Let me check the trigger...')
        
        // Try to check if user was created in auth but not in profiles
        if (signupData?.user?.id) {
          console.log('✅ User created in auth.users with ID:', signupData.user.id)
          
          // Check if profile was created
          const { data: profile, error: profileCheckError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', signupData.user.id)
            .single()
          
          if (profileCheckError) {
            console.error('❌ Profile not created:', profileCheckError.message)
            console.log('🔧 This confirms the trigger is failing')
          } else {
            console.log('✅ Profile created successfully:', profile)
          }
        }
      }
      return
    }
    
    console.log('✅ Signup successful!')
    console.log('User ID:', signupData.user?.id)
    console.log('User email:', signupData.user?.email)
    
    // Check if profile was created
    if (signupData.user?.id) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile not found:', profileError.message)
      } else {
        console.log('✅ Profile created:', profile)
      }
      
      // Clean up test user
      console.log('\n🧹 Cleaning up test user...')
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id)
      if (deleteError) {
        console.log('⚠️  Could not delete test user (this is normal with anon key)')
      } else {
        console.log('✅ Test user cleaned up')
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.error('Stack:', error.stack)
  }
}

debugSignup()
