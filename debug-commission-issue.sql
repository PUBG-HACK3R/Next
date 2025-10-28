-- Debug why commissions weren't calculated

-- 1. Check your user's referral setup
SELECT 
    id,
    full_name,
    email,
    referred_by,
    referral_code
FROM user_profiles 
WHERE id = '3c10d87d-8f5e-4e0e-b1d4-3c7b555efe17';

-- 2. Check if you have any referrer
SELECT 
    u1.full_name as your_name,
    u1.email as your_email,
    u2.full_name as referrer_name,
    u2.email as referrer_email,
    u1.referred_by as referrer_id
FROM user_profiles u1
LEFT JOIN user_profiles u2 ON u1.referred_by = u2.id
WHERE u1.id = '3c10d87d-8f5e-4e0e-b1d4-3c7b555efe17';

-- 3. Check commission settings
SELECT 
    referral_l1_percent,
    referral_l2_percent,
    referral_l3_percent
FROM admin_settings 
ORDER BY id DESC 
LIMIT 1;

-- 4. Check if any USDT commissions were created
SELECT 
    rc.*,
    up.full_name as referrer_name
FROM referral_commissions rc
JOIN user_profiles up ON rc.referrer_id = up.id
WHERE rc.usdt_deposit_id IS NOT NULL;

-- 5. Check your USDT deposits
SELECT 
    id,
    amount_usdt,
    amount_pkr,
    status,
    created_at
FROM usdt_deposits 
WHERE user_id = '3c10d87d-8f5e-4e0e-b1d4-3c7b555efe17'
ORDER BY created_at DESC;
