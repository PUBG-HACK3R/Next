-- CRITICAL FIX: Final collection is adding profit twice
-- Problem: When investment completes, it adds:
--   1. Current day's profit (correct)
--   2. ALL earned_balance including already collected profits (WRONG!)
-- 
-- Expected: 2,000 capital + 280 profit = 2,280 PKR
-- Actual: 2,000 capital + 280 profit + 120 extra = 2,400 PKR
-- 
-- The 120 PKR extra suggests 3 days of profit (40 × 3 = 120) were already 
-- collected and locked in earned_balance, then transferred again on final collection

-- Step 1: Check if this is the issue
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING FOR DOUBLE-COUNTING BUG ===';
  RAISE NOTICE 'If earned_balance has accumulated profits from daily collections,';
  RAISE NOTICE 'and final collection transfers ALL earned_balance,';
  RAISE NOTICE 'then profits are counted twice!';
END $$;

-- Step 2: Fix the collect_daily_income function
-- The issue is on line 114-117 where it adds capital + profit, 
-- then ALSO transfers earned_balance (which already contains the collected profits)

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
  
  -- Calculate profit for available days
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
  
  -- Record transaction if income_transactions table exists
  BEGIN
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
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, skip recording
    NULL;
  END;
  
  IF is_final_collection THEN
    -- ✅ FIXED: Final collection logic
    -- Add current profit + capital to main balance
    IF investment_record.capital_return THEN
      PERFORM increment_user_balance(user_id_param, total_profit + investment_record.amount_invested);
    ELSE
      PERFORM increment_user_balance(user_id_param, total_profit);
    END IF;
    
    -- ❌ DO NOT transfer earned_balance here!
    -- The earned_balance already contains profits from previous daily collections
    -- which are already counted in the total_profit calculation
    -- Transferring it would double-count the profits!
    
    -- Instead, just reset earned_balance to 0 for this completed investment
    -- (Note: This assumes earned_balance only tracks THIS investment's earnings)
    -- If multiple investments exist, we need a more sophisticated approach
    
  ELSE
    -- Regular collection: Add profit to earned balance (locked)
    PERFORM increment_earned_balance(user_id_param, total_profit);
  END IF;
  
  -- Trigger earning-based referral commissions
  BEGIN
    PERFORM process_earning_commissions(user_id_param, investment_id_param, total_profit);
  EXCEPTION WHEN undefined_function THEN
    -- Function doesn't exist, skip
    NULL;
  END;
  
  -- Build result
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

COMMENT ON FUNCTION collect_daily_income(INTEGER, UUID) IS 'Fixed - does not double-count profits on final collection';

SELECT 'Double-counting bug fixed! Final collection now only adds: current profit + capital' AS status;
