import { supabase } from './supabase'

export async function signUp(email: string, password: string, fullName: string, referralCode?: string) {
  // First, create the auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined, // Remove email confirmation
      data: {
        full_name: fullName,
        referred_by: referralCode || null,
      },
    },
  })
  
  if (error) {
    return { data, error }
  }
  
  // If auth user creation succeeded, create the user profile manually
  if (data.user) {
    try {
      // Find referring user if referral code provided
      let referringUserId = null
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single()
        
        if (referrer) {
          referringUserId = referrer.id
        }
      }
      
      // Generate a simple referral code
      const newReferralCode = 'ref' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          referred_by: referringUserId,
          referral_code: newReferralCode,
          balance: 0,
          user_level: 1
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        // If profile creation fails, we should clean up the auth user
        // But for now, let's just return the error
        return { data, error: { message: `Profile creation failed: ${profileError.message}` } as any }
      }
      
      console.log('User profile created successfully')
    } catch (profileError: any) {
      console.error('Unexpected profile creation error:', profileError)
      return { data, error: { message: `Profile creation failed: ${profileError.message}` } as any }
    }
  }
  
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  })
  
  return { data, error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export async function getCurrentUserWithProfile() {
  const { user, error: authError } = await getCurrentUser()
  
  if (authError || !user) {
    return { user: null, profile: null, error: authError }
  }
  
  // Check if user profile exists
  const { data: profile, error: profileError } = await getUserProfile(user.id)
  
  if (profileError) {
    console.error('User profile not found:', profileError)
    // If profile doesn't exist, try to create it
    if (profileError.code === 'PGRST116') { // No rows returned
      console.log('Creating missing user profile for user:', user.id)
      
      // Generate a referral code
      const newReferralCode = 'ref' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email || '',
          referred_by: null,
          referral_code: newReferralCode,
          balance: 0,
          user_level: 1
        })
        .select()
        .single()
      
      if (createError) {
        return { user, profile: null, error: createError }
      }
      
      return { user, profile: newProfile, error: null }
    }
    
    return { user, profile: null, error: profileError }
  }
  
  return { user, profile, error: null }
}
