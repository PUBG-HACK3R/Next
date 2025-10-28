import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if deposits table exists with correct structure
    const { data: depositsStructure, error: depositsError } = await supabase
      .from('deposits')
      .select('*')
      .limit(0)

    // Check if admin_settings has required columns
    const { data: adminSettings, error: adminError } = await supabase
      .from('admin_settings')
      .select('min_deposit_amount, usdt_wallet_address, min_usdt_deposit, usdt_to_pkr_rate, usdt_chains')
      .eq('id', 1)
      .single()

    // Check if user_profiles table exists
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)

    // Try to describe the deposits table structure
    let tableStructure = null
    try {
      const { data, error } = await supabase.rpc('get_table_structure', { table_name: 'deposits' })
      tableStructure = data
    } catch (e) {
      // RPC might not exist, that's okay
    }

    return NextResponse.json({
      deposits_table: {
        exists: !depositsError,
        error: depositsError?.message,
        code: depositsError?.code
      },
      admin_settings: {
        exists: !adminError,
        has_required_fields: !!(adminSettings?.min_deposit_amount),
        data: adminSettings,
        error: adminError?.message
      },
      user_profiles: {
        exists: !profilesError,
        error: profilesError?.message
      },
      table_structure: tableStructure,
      recommendations: getRecommendations(depositsError, adminError, profilesError),
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Database check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function getRecommendations(depositsError: any, adminError: any, profilesError: any) {
  const recommendations = []

  if (depositsError) {
    if (depositsError.code === 'PGRST106') {
      recommendations.push('❌ CRITICAL: deposits table does not exist. Run fresh-deposit-system.sql')
    } else {
      recommendations.push(`❌ deposits table error: ${depositsError.message}`)
    }
  } else {
    recommendations.push('✅ deposits table exists')
  }

  if (adminError) {
    recommendations.push(`❌ admin_settings error: ${adminError.message}`)
  } else {
    recommendations.push('✅ admin_settings table accessible')
  }

  if (profilesError) {
    recommendations.push(`❌ user_profiles error: ${profilesError.message}`)
  } else {
    recommendations.push('✅ user_profiles table exists')
  }

  if (depositsError?.code === 'PGRST106') {
    recommendations.push('')
    recommendations.push('🔧 TO FIX:')
    recommendations.push('1. Go to your Supabase dashboard')
    recommendations.push('2. Open SQL Editor')
    recommendations.push('3. Copy and paste the contents of fresh-deposit-system.sql')
    recommendations.push('4. Execute the SQL script')
  }

  return recommendations
}
