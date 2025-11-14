import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // First, create the function if it doesn't exist
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION auto_update_investment_status()
      RETURNS INTEGER AS $$
      DECLARE
        updated_count INTEGER := 0;
      BEGIN
        -- Update investments that have passed their end_date but are still marked as 'active'
        UPDATE investments 
        SET status = 'completed',
            updated_at = NOW()
        WHERE status = 'active' 
          AND end_date IS NOT NULL 
          AND end_date <= NOW();
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RETURN updated_count;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the function creation
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL 
    })

    if (createError) {
      console.error('Error creating function:', createError)
      // Try alternative approach - direct SQL execution
      const { error: directError } = await supabase
        .from('investments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('status', 'active')
        .lte('end_date', new Date().toISOString())

      if (directError) {
        throw directError
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Updated investment status directly',
        method: 'direct_update'
      })
    }

    // Now call the function
    const { data, error } = await supabase.rpc('auto_update_investment_status')

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount: data,
      message: `Updated ${data} investments to completed status`
    })

  } catch (error: any) {
    console.error('Error updating investment status:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost'))
}
