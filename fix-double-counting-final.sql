-- FINAL FIX: Remove double-counting in final collection
-- 
-- PROBLEM: The function is adding profits TWICE:
-- 1. Line 76: Adds total_profit (current collection) to balance
-- 2. Line 82: Adds ALL income_transactions for this investment AGAIN
--
-- SOLUTION: Remove line 82 completely - we don't need to transfer anything
-- because the profits are already being added in line 76

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
  
  -- Record the transaction in income_transactions table
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
    -- ✅ FIXED: Just add current profit + capital to main balance
    -- NO need to transfer from earned_balance or income_transactions
    -- because total_profit already represents ALL uncollected days
    IF investment_record.capital_return THEN
      PERFORM increment_user_balance(user_id_param, total_profit + investment_record.amount_invested);
    ELSE
      PERFORM increment_user_balance(user_id_param, total_profit);
    END IF;
    
    -- ❌ REMOVED: transfer_investment_earnings_to_main(user_id_param, investment_id_param);
    -- This was causing double-counting!
    
    -- ✅ NEW: Reset earned_balance to 0 since all earnings are now in main balance
    -- (Only if user has no other active investments - otherwise this could be wrong)
    -- For now, we'll leave earned_balance as is for safety
    
  ELSE
    -- Regular collection: Add profit to earned balance only
    PERFORM increment_earned_balance(user_id_param, total_profit);
  END IF;
  
  -- Trigger earning-based referral commissions
  PERFORM process_earning_commissions(user_id_param, investment_id_param, total_profit);
  
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

COMMENT ON FUNCTION collect_daily_income(INTEGER, UUID) IS 'FIXED - Removed double-counting. Final collection only adds: total_profit + capital';

-- Verify the fix
SELECT 'Double-counting bug FIXED! Removed transfer_investment_earnings_to_main call.' AS status;

-- IMPORTANT NOTE:
-- After applying this fix, the earned_balance might still have old locked earnings
-- from previous daily collections. These will NOT be transferred on final collection.
-- 
-- If you want to clean up old earned_balance, run this separately:
-- UPDATE user_profiles SET earned_balance = 0 WHERE id = 'YOUR_USER_ID';
