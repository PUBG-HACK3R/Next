import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserFromRequest, getUserProfile } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Alternative authentication function using Next.js cookies
async function getCurrentUserFromCookies() {
  try {
    const cookieStore = await cookies()
    
    // Get all cookies for authentication
    const allCookies = cookieStore.getAll()
    
    // Try different possible Supabase cookie names
    const possibleTokenNames = [
      'sb-access-token',
      'supabase-auth-token', 
      'sb-smartgrow-auth-token',
      'smartgrow-auth'
    ]
    
    for (const tokenName of possibleTokenNames) {
      const tokenCookie = cookieStore.get(tokenName)
      if (tokenCookie?.value) {
        console.log(`Found token in cookie: ${tokenName}`)
        const { data: { user }, error } = await supabase.auth.getUser(tokenCookie.value)
        if (user && !error) {
          return { user, error: null }
        }
      }
    }
    
    return { user: null, error: { message: 'No valid session found in cookies' } }
  } catch (error: any) {
    return { user: null, error: { message: error.message } }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Password GET: Starting authentication check...')
    
    // Try both authentication methods
    let user = null
    let authError = null
    
    // Method 1: Try getCurrentUserFromRequest
    const { user: user1, error: error1 } = await getCurrentUserFromRequest(request)
    if (user1 && !error1) {
      user = user1
    } else {
      console.log('Method 1 failed:', error1?.message)
      
      // Method 2: Try Next.js cookies
      const { user: user2, error: error2 } = await getCurrentUserFromCookies()
      if (user2 && !error2) {
        user = user2
      } else {
        console.log('Method 2 failed:', error2?.message)
        authError = error2 || error1
      }
    }
    
    if (!user || authError) {
      console.log('Password GET: Authentication failed:', authError?.message)
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: { hasUser: !!user, authError: authError?.message }
      }, { status: 401 })
    }

    // Get user profile to check admin level
    const { data: profile, error: profileError } = await getUserProfile(user.id)
    
    console.log('Password GET: Auth result:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      userLevel: profile?.user_level,
      profileError: profileError?.message 
    })

    // Check if user is admin
    if (!profile || profile.user_level < 999) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user authentication data using admin API
    const { data: authUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (fetchError) {
      console.error('Error fetching user auth data:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch user data', 
        details: fetchError.message,
        hint: 'Make sure SUPABASE_SERVICE_ROLE_KEY is set in environment variables'
      }, { status: 500 })
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user authentication information (without actual password)
    return NextResponse.json({
      user_id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
      email_confirmed_at: authUser.user.email_confirmed_at,
      // Note: We cannot retrieve the actual password as it's hashed
      password_info: {
        has_password: true,
        last_password_change: authUser.user.updated_at,
        note: 'Passwords are securely hashed and cannot be displayed'
      }
    })

  } catch (error) {
    console.error('Error in password GET route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Password POST: Starting authentication check...')
    
    // Try both authentication methods
    let user = null
    let authError = null
    
    // Method 1: Try getCurrentUserFromRequest
    const { user: user1, error: error1 } = await getCurrentUserFromRequest(request)
    if (user1 && !error1) {
      user = user1
    } else {
      console.log('POST Method 1 failed:', error1?.message)
      
      // Method 2: Try Next.js cookies
      const { user: user2, error: error2 } = await getCurrentUserFromCookies()
      if (user2 && !error2) {
        user = user2
      } else {
        console.log('POST Method 2 failed:', error2?.message)
        authError = error2 || error1
      }
    }
    
    if (!user || authError) {
      console.log('Password POST: Authentication failed:', authError?.message)
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: { hasUser: !!user, authError: authError?.message }
      }, { status: 401 })
    }

    // Get user profile to check admin level
    const { data: profile, error: profileError } = await getUserProfile(user.id)
    
    console.log('Password POST: Auth result:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      userLevel: profile?.user_level,
      profileError: profileError?.message 
    })

    // Check if user is admin
    if (!profile || profile.user_level < 999) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 })
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Update user password using admin API
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      console.error('Error updating user password:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update password', 
        details: updateError.message,
        hint: 'Make sure SUPABASE_SERVICE_ROLE_KEY is set in environment variables'
      }, { status: 500 })
    }

    // Log the password reset action
    console.log(`Admin ${user.id} reset password for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      user_id: userId
    })

  } catch (error) {
    console.error('Error in password POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
