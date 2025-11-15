-- ============================================
-- FORCE FIX: Drop and recreate the function
-- This will definitely work
-- ============================================

-- Step 1: Check current state
DO $$
DECLARE
  func_source TEXT;
BEGIN
  SELECT prosrc INTO func_source FROM pg_proc WHERE proname = 'collect_daily_income';
  
  IF func_source LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%' THEN
    RAISE NOTICE '❌ Current function HAS the bug';
  ELSE
    RAISE NOTICE '✅ Current function is already fixed';
  END IF;
END $$;

-- Step 2: Drop the old function completely
DROP FUNCTION IF EXISTS collect_daily_income(INTEGER, UUID) CASCADE;

-- Step 3: Create the fixed version from scratch
CREATE FUNCTION collect_daily_income(investment_id_param INTEGER, user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  
  -- Handle final vs regular collection
  IF is_final_collection THEN
    -- FIXED: Only add current profit + capital
    -- NO double-counting from income_transactions!
    IF investment_record.capital_return THEN
      PERFORM increment_user_balance(user_id_param, total_profit + investment_record.amount_invested);
    ELSE
      PERFORM increment_user_balance(user_id_param, total_profit);
    END IF;
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
$$;

-- Step 4: Verify the fix
DO $$
DECLARE
  func_source TEXT;
  has_bug BOOLEAN;
BEGIN
  SELECT prosrc INTO func_source FROM pg_proc WHERE proname = 'collect_daily_income';
  
  has_bug := func_source LIKE '%transfer_investment_earnings_to_main%';
  
  IF has_bug THEN
    RAISE EXCEPTION '❌ STILL FAILED! Something is very wrong. Check if there are multiple versions of this function.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUCCESS! FIX APPLIED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The double-counting bug has been removed.';
    RAISE NOTICE 'Function was dropped and recreated from scratch.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test with a new investment';
    RAISE NOTICE '2. Verify balance = capital + profit (exact)';
    RAISE NOTICE '3. If correct, proceed with launch preparation';
    RAISE NOTICE '';
  END IF;
END $$;

-- Step 5: Show what was removed
SELECT 'Bug removed: transfer_investment_earnings_to_main() call in final collection' AS fix_applied;
