-- ============================================
-- CRITICAL FIX: Remove Double-Counting Bug
-- Copy this ENTIRE file and run in Supabase SQL Editor
-- ============================================

-- First, let's see what we're fixing
DO $$
BEGIN
  RAISE NOTICE '=== APPLYING CRITICAL FIX ===';
  RAISE NOTICE 'This will remove the double-counting bug in collect_daily_income';
  RAISE NOTICE 'Bug: Line 82 calls transfer_investment_earnings_to_main which adds profits twice';
  RAISE NOTICE 'Fix: Remove that line completely';
END $$;

-- Now apply the fix
CREATE OR REPLACE FUNCTION collect_daily_income(investment_id_param INTEGER, user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  investment_record RECORD;
  available_days INTEGER;
  profit_per_day DECIMAL;
  total_profit DECIMAL;
  is_final_collection BOOLEAN := FALSE;
  result JSON;
BEGIN
  -- Get investment details
  SELECT i.*, p.duration_days, p.profit_percent, p.capital_return
  INTO investment_record
  FROM investments i
  JOIN plans p ON i.plan_id = p.id
  WHERE i.id = investment_id_param AND i.user_id = user_id_param AND i.status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Investment not found or not active');
  END IF;
  
  -- Calculate available days
  IF investment_record.last_income_collection_date IS NULL THEN
    available_days := LEAST(
      FLOOR(EXTRACT(EPOCH FROM (NOW() - investment_record.start_date)) / 86400),
      investment_record.duration_days - COALESCE(investment_record.total_days_collected, 0)
    );
  ELSE
    available_days := LEAST(
      FLOOR(EXTRACT(EPOCH FROM (NOW() - investment_record.last_income_collection_date)) / 86400),
      investment_record.duration_days - COALESCE(investment_record.total_days_collected, 0)
    );
  END IF;
  
  IF available_days <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'No days available for collection');
  END IF;
  
  -- Calculate profit
  profit_per_day := (investment_record.amount_invested * investment_record.profit_percent / 100) / investment_record.duration_days;
  total_profit := profit_per_day * available_days;
  
  -- Check if this is the final collection
  IF (COALESCE(investment_record.total_days_collected, 0) + available_days) >= investment_record.duration_days THEN
    is_final_collection := TRUE;
  END IF;
  
  -- Update investment record
  UPDATE investments 
  SET last_income_collection_date = NOW(),
      total_days_collected = COALESCE(total_days_collected, 0) + available_days,
      status = CASE WHEN is_final_collection THEN 'completed' ELSE status END
  WHERE id = investment_id_param;
  
  -- Record the transaction
  INSERT INTO income_transactions (
    user_id,
    investment_id,
    amount,
    days_collected,
    is_final_collection,
    status,
    created_at
  ) VALUES (
    user_id_param,
    investment_id_param,
    total_profit,
    available_days,
    is_final_collection,
    'completed',
    NOW()
  );
  
  IF is_final_collection THEN
    -- Add profit + capital to main balance
    IF investment_record.capital_return THEN
      PERFORM increment_user_balance(user_id_param, total_profit + investment_record.amount_invested);
    ELSE
      PERFORM increment_user_balance(user_id_param, total_profit);
    END IF;
    
    -- BUG WAS HERE: PERFORM transfer_investment_earnings_to_main(user_id_param, investment_id_param);
    -- REMOVED: This line was adding profits twice!
    
  ELSE
    -- Regular collection: Add to earned balance
    PERFORM increment_earned_balance(user_id_param, total_profit);
  END IF;
  
  -- Trigger commissions
  PERFORM process_earning_commissions(user_id_param, investment_id_param, total_profit);
  
  -- Return result
  result := json_build_object(
    'success', true,
    'profit_earned', total_profit,
    'days_collected', available_days,
    'is_final_collection', is_final_collection,
    'capital_returned', CASE WHEN is_final_collection AND investment_record.capital_return THEN investment_record.amount_invested ELSE 0 END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the fix was applied
DO $$
DECLARE
  func_source TEXT;
BEGIN
  SELECT prosrc INTO func_source FROM pg_proc WHERE proname = 'collect_daily_income';
  
  IF func_source LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%' THEN
    RAISE EXCEPTION '❌ FIX FAILED! The buggy line is still there!';
  ELSE
    RAISE NOTICE '✅ FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE 'The double-counting bug has been removed.';
    RAISE NOTICE 'You can now test with a new investment.';
  END IF;
END $$;
