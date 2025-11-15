import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserWithProfile, getCurrentUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('admin_settings')
      .select('id')
      .limit(1)

    // Test 2: Check regular auth
    const authResult = await getCurrentUserWithProfile()

    // Test 3: Check header-based auth
    const headerAuthResult = await getCurrentUserFromRequest(request)

    // Test 4: Check if deposits table exists
    const { data: depositsTest, error: depositsError } = await supabase
      .from('deposits')
      .select('id')
      .limit(1)

    return NextResponse.json({
      supabase_connection: testError ? 'FAILED' : 'OK',
      supabase_error: testError?.message,
      regular_auth: {
        hasUser: !!authResult.user,
        hasProfile: !!authResult.profile,
        error: authResult.error?.message
      },
      header_auth: {
        hasUser: !!headerAuthResult.user,
        error: headerAuthResult.error?.message,
        hasAuthHeader: !!request.headers.get('authorization')
      },
      deposits_table: depositsError ? 'NOT_FOUND' : 'EXISTS',
      deposits_error: depositsError?.message,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
