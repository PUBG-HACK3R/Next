-- Test if earnings commission (5%) is working properly

-- First, check if the collect_daily_income function exists and what it does
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'collect_daily_income'
AND routine_type = 'FUNCTION';

-- Check recent income transactions to see if earnings commissions are being created
SELECT 
    'Recent income transactions:' as info,
    it.*,
    up.full_name as user_name
FROM income_transactions it
JOIN user_profiles up ON it.user_id = up.id
WHERE it.created_at > NOW() - INTERVAL '24 hours'
ORDER BY it.created_at DESC
LIMIT 5;

-- Check if there are any earnings-related commissions (not deposit-related)
SELECT 
    'Earnings commissions (if any):' as info,
    rc.*,
    up_referrer.full_name as referrer_name,
    up_referred.full_name as referred_name
FROM referral_commissions rc
JOIN user_profiles up_referrer ON rc.referrer_id = up_referrer.id
JOIN user_profiles up_referred ON rc.referred_user_id = up_referred.id
WHERE rc.deposit_id IS NULL  -- These would be earnings commissions
OR rc.created_at > NOW() - INTERVAL '24 hours'
ORDER BY rc.created_at DESC
LIMIT 10;

-- Check current admin settings for earnings commission rates
SELECT 
    'Current commission rates:' as info,
    referral_l1_percent as l1_earnings_percent,
    referral_l1_deposit_percent as l1_deposit_percent,
    referral_l2_percent as l2_earnings_percent,
    referral_l3_percent as l3_earnings_percent
FROM admin_settings WHERE id = 1;

-- Test query to see if collect_daily_income function includes commission logic
SELECT 
    'Testing collect_daily_income function...' as info;

-- If the function doesn't include commission logic, we need to add it
-- Let's check what parameters it takes
SELECT 
    routine_name,
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'collect_daily_income'
)
ORDER BY ordinal_position;
