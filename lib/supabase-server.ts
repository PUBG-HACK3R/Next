import { createClient } from '@supabase/supabase-js'

// Simple server client - we'll handle auth manually
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getCurrentUserServer() {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error: any) {
    return { user: null, error }
  }
}

export async function getCurrentUserWithProfileServer() {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null, profile: null, error: authError }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return { user, profile: null, error: profileError }
    }

    return { user, profile, error: null }
  } catch (error: any) {
    return { user: null, profile: null, error }
  }
}
