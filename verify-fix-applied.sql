-- Better verification script to check if the fix is applied

-- Check 1: Look for the ABSENCE of transfer_investment_earnings_to_main in final collection
SELECT 
  'Function Check' as test_name,
  CASE 
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%' 
    THEN '❌ BUG STILL EXISTS - Line 82 is still there!'
    WHEN prosrc LIKE '%increment_user_balance(user_id_param, total_profit + investment_record.amount_invested)%'
         AND prosrc NOT LIKE '%transfer_investment_earnings_to_main(user_id_param, investment_id_param)%'
    THEN '✅ FIX APPLIED - Line 82 removed!'
    ELSE '⚠️ UNKNOWN - Check manually'
  END as status,
  LENGTH(prosrc) as function_length
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Check 2: Show the critical section of the function
SELECT 
  'Critical Section' as info,
  SUBSTRING(
    prosrc 
    FROM POSITION('IF is_final_collection THEN' IN prosrc)
    FOR 500
  ) as final_collection_code
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Check 3: Count how many times transfer_investment_earnings_to_main appears
SELECT 
  'transfer_investment_earnings_to_main calls' as check_name,
  (LENGTH(prosrc) - LENGTH(REPLACE(prosrc, 'transfer_investment_earnings_to_main', ''))) / 
  LENGTH('transfer_investment_earnings_to_main') as call_count,
  CASE 
    WHEN prosrc LIKE '%transfer_investment_earnings_to_main%' 
    THEN '❌ Function still calls transfer_investment_earnings_to_main'
    ELSE '✅ Function does NOT call transfer_investment_earnings_to_main'
  END as status
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Check 4: Show function modification date
SELECT 
  proname as function_name,
  'Last modified' as info,
  obj_description(oid, 'pg_proc') as description
FROM pg_proc 
WHERE proname = 'collect_daily_income';
