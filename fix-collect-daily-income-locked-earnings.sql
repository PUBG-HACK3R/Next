-- Fix the locked earnings bug in collect_daily_income function
-- Problem: When investment completes, ALL locked earnings are transferred to main balance
-- Solution: Only transfer earnings from the completed investment, keep others locked

-- Create helper function to transfer only specific investment earnings
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

-- Update collect_daily_income function with the fix
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
    -- Final collection: Add current profit to main balance
    IF investment_record.capital_return THEN
      PERFORM increment_user_balance(user_id_param, total_profit + investment_record.amount_invested);
    ELSE
      PERFORM increment_user_balance(user_id_param, total_profit);
    END IF;
    
    -- ✅ FIXED: Only transfer earnings from THIS completed investment
    -- Instead of: PERFORM transfer_earned_to_main(user_id_param);
    PERFORM transfer_investment_earnings_to_main(user_id_param, investment_id_param);
    
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

-- Add documentation
COMMENT ON FUNCTION transfer_investment_earnings_to_main(UUID, INTEGER) IS 'Transfers only earnings from a specific completed investment, keeping other locked earnings intact';
COMMENT ON FUNCTION collect_daily_income(INTEGER, UUID) IS 'Fixed - only transfers earnings from completed investment, not all locked earnings';

SELECT 'Locked earnings bug fixed successfully' AS status;
