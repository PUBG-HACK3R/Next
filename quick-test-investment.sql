-- Quick Test Script for Investment Bug Fix
-- This will help you verify the fix is working correctly

-- Step 1: Check current function version
SELECT 
  CASE 
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main%' 
    THEN '❌ OLD VERSION - Still has the bug! Apply fix-double-counting-final.sql'
    WHEN prosrc LIKE '%Removed the double-counting line%'
    THEN '✅ FIXED VERSION - Bug is fixed!'
    ELSE '⚠️ UNKNOWN VERSION - Check manually'
  END as function_status
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Step 2: Test with your current investment
-- Replace YOUR_USER_ID and YOUR_INVESTMENT_ID with actual values

DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
  test_investment_id INTEGER := 1; -- ⚠️ REPLACE WITH YOUR INVESTMENT ID
  
  balance_before DECIMAL;
  earned_before DECIMAL;
  balance_after DECIMAL;
  earned_after DECIMAL;
  
  investment_amount DECIMAL;
  investment_profit DECIMAL;
  days_remaining INTEGER;
  
  expected_balance DECIMAL;
  actual_difference DECIMAL;
BEGIN
  -- Get balances before
  SELECT balance, earned_balance INTO balance_before, earned_before
  FROM user_profiles WHERE id = test_user_id;
  
  -- Get investment details
  SELECT 
    i.amount_invested,
    (i.amount_invested * p.profit_percent / 100) as total_profit,
    p.duration_days - COALESCE(i.total_days_collected, 0) as days_remaining
  INTO investment_amount, investment_profit, days_remaining
  FROM investments i
  JOIN plans p ON i.plan_id = p.id
  WHERE i.id = test_investment_id AND i.user_id = test_user_id;
  
  RAISE NOTICE '=== BEFORE COLLECTION ===';
  RAISE NOTICE 'Balance: %', balance_before;
  RAISE NOTICE 'Earned Balance: %', earned_before;
  RAISE NOTICE 'Investment Amount: %', investment_amount;
  RAISE NOTICE 'Total Profit: %', investment_profit;
  RAISE NOTICE 'Days Remaining: %', days_remaining;
  
  -- Calculate expected balance after final collection
  expected_balance := balance_before + investment_amount + investment_profit;
  
  RAISE NOTICE '=== EXPECTED AFTER FINAL COLLECTION ===';
  RAISE NOTICE 'Expected Balance: % (current % + capital % + profit %)', 
    expected_balance, balance_before, investment_amount, investment_profit;
  
  -- Note: Don't actually collect here, just show what to expect
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ To test: Go to app and collect the final income';
  RAISE NOTICE '✅ If balance = %, the bug is FIXED!', expected_balance;
  RAISE NOTICE '❌ If balance > %, the bug still exists!', expected_balance;
END $$;

-- Step 3: After you collect, run this to verify
-- Uncomment and run AFTER collecting final income

/*
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
  actual_balance DECIMAL;
  expected_balance DECIMAL;
BEGIN
  SELECT balance INTO actual_balance
  FROM user_profiles WHERE id = test_user_id;
  
  -- Calculate expected (you'll need to update this with your numbers)
  expected_balance := 2280; -- Update this with expected amount
  
  IF actual_balance = expected_balance THEN
    RAISE NOTICE '✅ SUCCESS! Balance is correct: %', actual_balance;
  ELSE
    RAISE NOTICE '❌ FAILED! Balance is %, expected %', actual_balance, expected_balance;
    RAISE NOTICE 'Difference: %', actual_balance - expected_balance;
  END IF;
END $$;
*/
