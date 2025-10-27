-- Force commission payment - simplified version
-- This will find and pay commissions step by step

-- Step 1: Check what we have
SELECT 'Step 1: Checking deposits and users...' as info;

-- Show all completed deposits with user info
SELECT 
    d.id as deposit_id,
    d.amount,
    d.status,
    d.user_id,
    up.full_name as depositor_name,
    up.referred_by,
    referrer.full_name as referrer_name,
    referrer.id as referrer_id
FROM deposits d
JOIN user_profiles up ON d.user_id = up.id
LEFT JOIN user_profiles referrer ON up.referred_by = referrer.id
WHERE d.status IN ('Completed', 'completed', 'Approved', 'approved')
ORDER BY d.created_at DESC;

-- Step 2: Check admin settings
SELECT 'Step 2: Admin settings...' as info;
SELECT * FROM admin_settings WHERE id = 1;

-- Step 3: Manual commission payment
DO $$
DECLARE
    deposit_rec RECORD;
    commission_amount DECIMAL(10,2);
    l1_percent DECIMAL(5,2) := 5.0; -- Default 5% if admin settings missing
BEGIN
    RAISE NOTICE 'Starting manual commission payment...';
    
    -- Get commission rate from admin settings
    SELECT referral_l1_percent INTO l1_percent 
    FROM admin_settings WHERE id = 1;
    
    IF l1_percent IS NULL THEN
        l1_percent := 5.0; -- Default to 5%
        RAISE NOTICE 'Using default 5% commission rate';
    ELSE
        RAISE NOTICE 'Using admin setting: % commission rate', l1_percent;
    END IF;
    
    -- Find deposits from referred users and pay commissions
    FOR deposit_rec IN 
        SELECT 
            d.id as deposit_id,
            d.amount,
            d.user_id as depositor_id,
            up.full_name as depositor_name,
            up.referred_by as referrer_id,
            referrer.full_name as referrer_name,
            referrer.balance as current_balance
        FROM deposits d
        JOIN user_profiles up ON d.user_id = up.id
        JOIN user_profiles referrer ON up.referred_by = referrer.id
        WHERE d.status IN ('Completed', 'completed', 'Approved', 'approved')
        AND up.referred_by IS NOT NULL
    LOOP
        -- Check if commission already exists
        IF NOT EXISTS (SELECT 1 FROM referral_commissions WHERE deposit_id = deposit_rec.deposit_id) THEN
            
            commission_amount := deposit_rec.amount * (l1_percent / 100.0);
            
            RAISE NOTICE 'Processing: % deposited %, paying % commission to %', 
                deposit_rec.depositor_name, 
                deposit_rec.amount, 
                commission_amount, 
                deposit_rec.referrer_name;
            
            -- Insert commission record
            INSERT INTO referral_commissions (
                referrer_id, 
                referred_user_id, 
                deposit_id, 
                commission_amount, 
                commission_percent, 
                level, 
                status
            ) VALUES (
                deposit_rec.referrer_id,
                deposit_rec.depositor_id,
                deposit_rec.deposit_id,
                commission_amount,
                l1_percent,
                1,
                'Completed'
            );
            
            -- Update referrer balance
            UPDATE user_profiles 
            SET balance = balance + commission_amount 
            WHERE id = deposit_rec.referrer_id;
            
            RAISE NOTICE 'SUCCESS: Paid % to % (new balance will be %)', 
                commission_amount, 
                deposit_rec.referrer_name,
                deposit_rec.current_balance + commission_amount;
        ELSE
            RAISE NOTICE 'Commission already exists for deposit %', deposit_rec.deposit_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Commission payment process completed!';
END $$;

-- Step 4: Show final results
SELECT 'Step 4: Final results...' as info;

-- Show updated balances
SELECT 
    full_name,
    balance,
    referral_code
FROM user_profiles 
WHERE id IN (
    SELECT DISTINCT referred_by 
    FROM user_profiles 
    WHERE referred_by IS NOT NULL
)
ORDER BY balance DESC;

-- Show commission records
SELECT 
    rc.commission_amount,
    rc.level,
    rc.status,
    rc.created_at,
    referrer.full_name as referrer_name,
    referred.full_name as referred_name,
    d.amount as deposit_amount
FROM referral_commissions rc
JOIN user_profiles referrer ON rc.referrer_id = referrer.id
JOIN user_profiles referred ON rc.referred_user_id = referred.id
JOIN deposits d ON rc.deposit_id = d.id
ORDER BY rc.created_at DESC;
