-- Diagnostic SQL to identify the balance calculation bug
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check if income_transactions table exists
SELECT 
  'income_transactions table' AS check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'income_transactions') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING - This is the problem!' 
  END AS status;

-- 2. Check current collect_daily_income function
SELECT 
  'collect_daily_income function' AS check_name,
  CASE 
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main%' 
    THEN '✅ FIXED VERSION' 
    ELSE '❌ OLD VERSION - Still using transfer_earned_to_main' 
  END AS status
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- 3. Check if transfer_investment_earnings_to_main function exists
SELECT 
  'transfer_investment_earnings_to_main' AS check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'transfer_investment_earnings_to_main') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END AS status;

-- 4. For your specific case - Check your user's data
-- Replace 'YOUR_USER_ID' with your actual user ID
DO $$
DECLARE
  your_user_id UUID := 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS
  user_balance DECIMAL;
  user_earned DECIMAL;
  total_deposits DECIMAL;
  total_withdrawals DECIMAL;
  completed_investments_capital DECIMAL;
  completed_investments_profit DECIMAL;
BEGIN
  -- Get current balances
  SELECT balance, earned_balance INTO user_balance, user_earned
  FROM user_profiles WHERE id = your_user_id;
  
  -- Get total deposits
  SELECT COALESCE(SUM(amount_pkr), 0) INTO total_deposits
  FROM deposits WHERE user_id = your_user_id AND status = 'approved';
  
  -- Get total withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO total_withdrawals
  FROM withdrawals WHERE user_id = your_user_id AND status = 'approved';
  
  -- Get completed investments capital
  SELECT COALESCE(SUM(amount_invested), 0) INTO completed_investments_capital
  FROM investments WHERE user_id = your_user_id AND status = 'completed';
  
  -- Get completed investments profit
  SELECT COALESCE(SUM(amount), 0) INTO completed_investments_profit
  FROM income_transactions 
  WHERE user_id = your_user_id AND is_final_collection = true;
  
  RAISE NOTICE '=== YOUR ACCOUNT ANALYSIS ===';
  RAISE NOTICE 'Current Balance: %', user_balance;
  RAISE NOTICE 'Earned Balance (Locked): %', user_earned;
  RAISE NOTICE 'Total Deposits: %', total_deposits;
  RAISE NOTICE 'Total Withdrawals: %', total_withdrawals;
  RAISE NOTICE 'Completed Investments Capital: %', completed_investments_capital;
  RAISE NOTICE 'Completed Investments Profit: %', completed_investments_profit;
  RAISE NOTICE 'Expected Balance: % (deposits - withdrawals + completed capital + completed profit)', 
    total_deposits - total_withdrawals + completed_investments_capital + completed_investments_profit;
  RAISE NOTICE 'Difference: %', user_balance - (total_deposits - total_withdrawals + completed_investments_capital + completed_investments_profit);
END $$;

-- 5. Check if income_transactions table has your data
SELECT 
  'Your income transactions' AS info,
  COUNT(*) AS total_transactions,
  SUM(amount) AS total_income_collected,
  SUM(CASE WHEN is_final_collection THEN amount ELSE 0 END) AS final_collection_amount
FROM income_transactions 
WHERE user_id = 'YOUR_USER_ID'; -- ⚠️ REPLACE THIS

-- 6. Show the actual function code to verify
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'collect_daily_income'
LIMIT 1;
