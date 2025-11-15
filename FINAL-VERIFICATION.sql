-- ============================================
-- FINAL VERIFICATION: Is the bug actually fixed?
-- ============================================

-- Test 1: Check if the buggy line is present
SELECT 
  '1. Bug Check' as test_name,
  CASE 
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%' 
    THEN '❌ BUG EXISTS - The double-counting line is still there!'
    ELSE '✅ BUG REMOVED - The double-counting line is gone!'
  END as result
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Test 2: Check if the correct logic is present
SELECT 
  '2. Correct Logic Check' as test_name,
  CASE 
    WHEN prosrc LIKE '%increment_user_balance(user_id_param, total_profit + investment_record.amount_invested)%'
    THEN '✅ CORRECT - Has the right balance increment logic'
    ELSE '❌ WRONG - Missing correct balance increment'
  END as result
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Test 3: Show the final collection section
SELECT 
  '3. Final Collection Code' as test_name,
  SUBSTRING(
    prosrc 
    FROM POSITION('IF is_final_collection THEN' IN prosrc)
    FOR 600
  ) as code_section
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Test 4: Count occurrences of the buggy function call
SELECT 
  '4. Bug Count' as test_name,
  (LENGTH(prosrc) - LENGTH(REPLACE(prosrc, 'transfer_investment_earnings_to_main', ''))) / 
  LENGTH('transfer_investment_earnings_to_main') as occurrences,
  CASE 
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main%' 
    THEN '❌ Bug function is called ' || 
         ((LENGTH(prosrc) - LENGTH(REPLACE(prosrc, 'transfer_investment_earnings_to_main', ''))) / 
         LENGTH('transfer_investment_earnings_to_main'))::text || ' time(s)'
    ELSE '✅ Bug function is NOT called (0 times)'
  END as result
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- FINAL VERDICT
SELECT 
  '=== FINAL VERDICT ===' as test_name,
  CASE 
    WHEN prosrc NOT LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%'
         AND prosrc LIKE '%increment_user_balance%'
    THEN '✅✅✅ BUG IS FIXED! Safe to test and launch! ✅✅✅'
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%'
    THEN '❌❌❌ BUG STILL EXISTS! DO NOT LAUNCH! ❌❌❌'
    ELSE '⚠️⚠️⚠️ UNCLEAR - Manual inspection needed ⚠️⚠️⚠️'
  END as verdict
FROM pg_proc 
WHERE proname = 'collect_daily_income';
