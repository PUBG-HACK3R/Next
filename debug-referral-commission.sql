-- Debug referral commission system
-- This script will help identify why commissions weren't paid

-- Check if referral_commissions table exists and has data
SELECT 'Checking referral_commissions table...' as step;
SELECT COUNT(*) as total_commissions FROM referral_commissions;
SELECT * FROM referral_commissions ORDER BY created_at DESC LIMIT 5;

-- Check admin settings for commission percentages
SELECT 'Checking admin settings...' as step;
SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
FROM admin_settings WHERE id = 1;

-- Check user profiles and referral relationships
SELECT 'Checking user profiles and referrals...' as step;
SELECT 
    id,
    full_name,
    referral_code,
    referred_by,
    balance,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Check deposits and their status
SELECT 'Checking deposits...' as step;
SELECT 
    d.id,
    d.user_id,
    d.amount,
    d.status,
    d.created_at,
    up.full_name,
    up.referred_by
FROM deposits d
JOIN user_profiles up ON d.user_id = up.id
WHERE d.status = 'Completed'
ORDER BY d.created_at DESC
LIMIT 10;

-- Check if there are any referral relationships
SELECT 'Checking referral relationships...' as step;
SELECT 
    referrer.full_name as referrer_name,
    referrer.referral_code,
    referrer.balance as referrer_balance,
    referred.full_name as referred_name,
    referred.id as referred_id
FROM user_profiles referrer
JOIN user_profiles referred ON referred.referred_by = referrer.id
ORDER BY referred.created_at DESC;

-- Check for any existing commissions
SELECT 'Checking existing commissions...' as step;
SELECT 
    rc.*,
    referrer.full_name as referrer_name,
    referred.full_name as referred_name,
    d.amount as deposit_amount
FROM referral_commissions rc
JOIN user_profiles referrer ON rc.referrer_id = referrer.id
JOIN user_profiles referred ON rc.referred_user_id = referred.id
LEFT JOIN deposits d ON rc.deposit_id = d.id
ORDER BY rc.created_at DESC;

-- Manual commission calculation test
SELECT 'Manual commission test...' as step;
DO $$
DECLARE
    deposit_record RECORD;
    referred_user RECORD;
    referrer_user RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Get admin settings
    SELECT referral_l1_percent INTO admin_settings 
    FROM admin_settings WHERE id = 1;
    
    RAISE NOTICE 'Admin L1 commission rate: %', admin_settings.referral_l1_percent;
    
    -- Find completed deposits from referred users
    FOR deposit_record IN 
        SELECT d.*, up.referred_by, up.full_name
        FROM deposits d
        JOIN user_profiles up ON d.user_id = up.id
        WHERE d.status = 'Completed' 
        AND up.referred_by IS NOT NULL
        ORDER BY d.created_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE 'Found deposit: ID=%, Amount=%, User=%, Referred_by=%', 
            deposit_record.id, deposit_record.amount, deposit_record.full_name, deposit_record.referred_by;
        
        -- Find the referrer
        SELECT * INTO referrer_user 
        FROM user_profiles 
        WHERE id = deposit_record.referred_by;
        
        IF referrer_user.id IS NOT NULL THEN
            commission_amount := deposit_record.amount * (admin_settings.referral_l1_percent / 100.0);
            RAISE NOTICE 'Should pay commission: % to % (ID: %)', 
                commission_amount, referrer_user.full_name, referrer_user.id;
        ELSE
            RAISE NOTICE 'No referrer found for referred_by: %', deposit_record.referred_by;
        END IF;
    END LOOP;
END $$;
