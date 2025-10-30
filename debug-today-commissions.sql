-- Debug today's commissions issue
-- Check all referral commissions and their dates

-- First, let's see all commissions
SELECT 
    id,
    referrer_id,
    referred_user_id,
    commission_amount,
    level,
    status,
    created_at,
    -- Convert to different date formats for comparison
    DATE(created_at) as commission_date,
    DATE(created_at AT TIME ZONE 'UTC') as commission_date_utc,
    DATE(created_at AT TIME ZONE 'Asia/Karachi') as commission_date_pkt,
    EXTRACT(EPOCH FROM created_at) as timestamp_epoch,
    -- Today's date in different formats
    CURRENT_DATE as today,
    DATE(NOW()) as today_now,
    DATE(NOW() AT TIME ZONE 'UTC') as today_utc,
    DATE(NOW() AT TIME ZONE 'Asia/Karachi') as today_pkt
FROM referral_commissions 
ORDER BY created_at DESC;

-- Check if any commissions are from today
SELECT 
    COUNT(*) as total_commissions,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_commissions,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as yesterday_commissions,
    SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN commission_amount ELSE 0 END) as today_total,
    SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN commission_amount ELSE 0 END) as yesterday_total,
    SUM(commission_amount) as grand_total
FROM referral_commissions;

-- Check timezone settings
SELECT 
    name, 
    setting 
FROM pg_settings 
WHERE name IN ('timezone', 'log_timezone');

-- Check specific user's commissions (replace with actual user ID)
SELECT 
    *,
    DATE(created_at) as commission_date,
    CASE 
        WHEN DATE(created_at) = CURRENT_DATE THEN 'TODAY'
        WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 'YESTERDAY'
        ELSE 'OTHER'
    END as date_category
FROM referral_commissions 
WHERE referrer_id = 'test1-user-id-here'  -- Replace with actual test1 user ID
ORDER BY created_at DESC;
