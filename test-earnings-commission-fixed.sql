-- Test earnings commission system - fixed SQL

-- Check if collect_daily_income function exists
SELECT 
    'collect_daily_income function:' as info,
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'collect_daily_income';

-- Check recent income transactions
SELECT 
    'Recent income transactions:' as info,
    it.*,
    up.full_name as user_name
FROM income_transactions it
JOIN user_profiles up ON it.user_id = up.id
WHERE it.created_at > NOW() - INTERVAL '24 hours'
ORDER BY it.created_at DESC
LIMIT 5;

-- Check recent investments and their status
SELECT 
    'Recent investments:' as info,
    i.*,
    up.full_name as investor_name,
    p.name as plan_name,
    p.duration_days,
    p.profit_percent
FROM investments i
JOIN user_profiles up ON i.user_id = up.id
JOIN plans p ON i.plan_id = p.id
ORDER BY i.created_at DESC
LIMIT 5;

-- Check if there are earnings-related commissions
SELECT 
    'All recent commissions:' as info,
    rc.*,
    up_referrer.full_name as referrer_name,
    up_referred.full_name as referred_name,
    CASE 
        WHEN rc.deposit_id IS NOT NULL THEN 'DEPOSIT'
        ELSE 'EARNINGS'
    END as commission_type
FROM referral_commissions rc
JOIN user_profiles up_referrer ON rc.referrer_id = up_referrer.id
JOIN user_profiles up_referred ON rc.referred_user_id = up_referred.id
WHERE rc.created_at > NOW() - INTERVAL '24 hours'
ORDER BY rc.created_at DESC;

-- Check current commission rates
SELECT 
    'Commission rates:' as info,
    referral_l1_percent as l1_earnings_percent,
    referral_l1_deposit_percent as l1_deposit_percent,
    referral_l2_percent as l2_earnings_percent,
    referral_l3_percent as l3_earnings_percent
FROM admin_settings WHERE id = 1;

-- Check if there's a trigger or function for when investments complete
SELECT 
    'Investment completion triggers:' as info,
    trigger_name, 
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'investments'
ORDER BY trigger_name;
