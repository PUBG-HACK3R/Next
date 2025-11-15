-- Setup Test Investment for Final Collection Testing
-- User ID: ca38355f-d402-4ba0-b5be-08013d6d3945
-- Investment ID: 31

-- Step 1: Check current user state
SELECT 'Current User State' as info;
SELECT 
  id,
  full_name,
  email,
  balance,
  earned_balance
FROM user_profiles 
WHERE id = 'ca38355f-d402-4ba0-b5be-08013d6d3945';

-- Step 2: Check if investment exists
SELECT 'Current Investment State' as info;
SELECT 
  i.*,
  p.name as plan_name,
  p.duration_days,
  p.profit_percent,
  p.capital_return
FROM investments i
LEFT JOIN plans p ON i.plan_id = p.id
WHERE i.id = 31 AND i.user_id = 'ca38355f-d402-4ba0-b5be-08013d6d3945';

-- Step 3: Setup the test investment
-- This will update the investment to be ready for final collection

UPDATE investments 
SET 
  start_date = NOW() - INTERVAL '6 days',  -- Started 6 days ago
  last_income_collection_date = NOW() - INTERVAL '6 days',  -- Last collected 6 days ago
  total_days_collected = 6,  -- Already collected 6 out of 7 days
  status = 'active'
WHERE id = 31 
  AND user_id = 'ca38355f-d402-4ba0-b5be-08013d6d3945';

-- Step 4: Verify the setup
SELECT '✅ Investment Setup Complete' as status;

SELECT 
  'Investment Details' as info,
  i.id,
  i.amount_invested,
  i.status,
  i.start_date,
  i.last_income_collection_date,
  i.total_days_collected,
  p.duration_days,
  p.profit_percent,
  p.capital_return,
  -- Calculate expected results
  (i.amount_invested * p.profit_percent / 100) as total_profit,
  (i.amount_invested * p.profit_percent / 100) / p.duration_days as profit_per_day,
  -- Days available for collection (should be 1 - the final day)
  FLOOR(EXTRACT(EPOCH FROM (NOW() - i.last_income_collection_date)) / 86400) as days_available,
  p.duration_days - i.total_days_collected as days_remaining
FROM investments i
JOIN plans p ON i.plan_id = p.id
WHERE i.id = 31 
  AND i.user_id = 'ca38355f-d402-4ba0-b5be-08013d6d3945';

-- Step 5: Calculate expected final balance
DO $$
DECLARE
  current_balance DECIMAL;
  investment_amount DECIMAL;
  profit_percent DECIMAL;
  total_profit DECIMAL;
  profit_per_day DECIMAL;
  final_day_profit DECIMAL;
  expected_balance DECIMAL;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM user_profiles 
  WHERE id = 'ca38355f-d402-4ba0-b5be-08013d6d3945';
  
  -- Get investment details
  SELECT 
    i.amount_invested,
    p.profit_percent
  INTO investment_amount, profit_percent
  FROM investments i
  JOIN plans p ON i.plan_id = p.id
  WHERE i.id = 31;
  
  -- Calculate profits
  total_profit := (investment_amount * profit_percent / 100);
  profit_per_day := total_profit / 7;
  final_day_profit := profit_per_day * 1; -- Only 1 day remaining
  expected_balance := current_balance + investment_amount + final_day_profit;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 EXPECTED RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current balance: % PKR', current_balance;
  RAISE NOTICE 'Investment amount: % PKR', investment_amount;
  RAISE NOTICE 'Total profit (7 days): % PKR', total_profit;
  RAISE NOTICE 'Profit per day: % PKR', profit_per_day;
  RAISE NOTICE 'Final day profit: % PKR', final_day_profit;
  RAISE NOTICE '';
  RAISE NOTICE '✅ EXPECTED FINAL BALANCE: % PKR', expected_balance;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  If balance > %, BUG EXISTS!', expected_balance;
  RAISE NOTICE '✅ If balance = %, BUG FIXED!', expected_balance;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Step 6: Test instructions
SELECT '
🎯 TEST INSTRUCTIONS:
1. Login with user ID: ca38355f-d402-4ba0-b5be-08013d6d3945
2. Go to "My Investments" page
3. Find investment #31
4. Click "Collect Income" button
5. Check if balance matches expected amount above
6. If correct = BUG FIXED ✅
7. If higher = BUG EXISTS ❌
' as instructions;
