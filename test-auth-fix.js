// Test authentication fix
// Add this to a component to test if auth is working

import { supabase } from '@/lib/supabase'

// Test function to check authentication
const testAuth = async () => {
  console.log('=== AUTHENTICATION TEST ===')
  
  // Check current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  console.log('Current session:', session)
  console.log('Session error:', sessionError)
  
  // Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('Current user:', user)
  console.log('User error:', userError)
  
  // Test a simple query
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .limit(1)
  
  console.log('Query data:', data)
  console.log('Query error:', error)
  
  console.log('=== END TEST ===')
}

// Call this function in a useEffect or button click
testAuth()
