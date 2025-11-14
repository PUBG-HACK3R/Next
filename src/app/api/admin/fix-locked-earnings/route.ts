import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Create the new function to transfer only specific investment earnings
    const createTransferFunctionSQL = `
      CREATE OR REPLACE FUNCTION transfer_investment_earnings_to_main(user_id_param UUID, investment_id_param INTEGER)
      RETURNS DECIMAL AS $$
      DECLARE
        total_investment_earnings DECIMAL := 0;
      BEGIN
        -- Calculate total earnings from this specific investment
        SELECT COALESCE(SUM(amount), 0) INTO total_investment_earnings
        FROM income_transactions 
        WHERE user_id = user_id_param 
          AND investment_id = investment_id_param
          AND status = 'completed';
        
        -- Only transfer if there are earnings from this investment
        IF total_investment_earnings > 0 THEN
          -- Add investment earnings to main balance
          UPDATE user_profiles 
          SET balance = COALESCE(balance, 0) + total_investment_earnings,
              updated_at = NOW()
          WHERE id = user_id_param;
          
          -- Subtract only this investment's earnings from earned_balance
          UPDATE user_profiles 
          SET earned_balance = GREATEST(0, COALESCE(earned_balance, 0) - total_investment_earnings),
              updated_at = NOW()
          WHERE id = user_id_param;
        END IF;
        
        RETURN total_investment_earnings;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the function creation using raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTransferFunctionSQL 
    })

    if (createError) {
      console.error('Error creating transfer function:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create transfer function: ' + createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Locked earnings bug fix applied successfully. The system will now only transfer earnings from completed investments, keeping other locked earnings intact.'
    })

  } catch (error: any) {
    console.error('Error applying locked earnings fix:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost'))
}
