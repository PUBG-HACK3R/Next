-- Simple commission payment - guaranteed to work
-- This will manually pay the 5% commission

-- Step 1: Show current situation
SELECT 'Current balances:' as info;
SELECT full_name, balance FROM user_profiles WHERE full_name IN ('khan khan', 'testing');

-- Step 2: Show deposits and referrals
SELECT 'Deposits and referrals:' as info;
SELECT 
    d.id as deposit_id,
    d.amount,
    d.status,
    depositor.full_name as depositor_name,
    referrer.full_name as referrer_name,
    referrer.id as referrer_id
FROM deposits d
JOIN user_profiles depositor ON d.user_id = depositor.id
LEFT JOIN user_profiles referrer ON depositor.referred_by = referrer.id
WHERE d.status IN ('Completed', 'completed', 'Approved', 'approved')
ORDER BY d.created_at DESC;

-- Step 3: Manual commission payment
DO $$
DECLARE
    commission_amount DECIMAL(10,2) := 50.00; -- 5% of 1000
    referrer_id UUID;
    found_deposit_id INTEGER;
    depositor_id UUID;
BEGIN
    -- Find the deposit and referrer
    SELECT 
        d.id,
        d.user_id,
        depositor.referred_by
    INTO found_deposit_id, depositor_id, referrer_id
    FROM deposits d
    JOIN user_profiles depositor ON d.user_id = depositor.id
    WHERE d.amount = 1000 
    AND d.status IN ('Completed', 'completed', 'Approved', 'approved')
    AND depositor.referred_by IS NOT NULL
    LIMIT 1;
    
    IF referrer_id IS NOT NULL THEN
        -- Check if commission already exists
        IF NOT EXISTS (SELECT 1 FROM referral_commissions WHERE deposit_id = found_deposit_id) THEN
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
                referrer_id,
                depositor_id,
                found_deposit_id,
                commission_amount,
                5.0,
                1,
                'Completed'
            );
            
            -- Update referrer balance
            UPDATE user_profiles 
            SET balance = balance + commission_amount 
            WHERE id = referrer_id;
            
            RAISE NOTICE 'SUCCESS: Paid 50 PKR commission!';
        ELSE
            RAISE NOTICE 'Commission already exists';
        END IF;
    ELSE
        RAISE NOTICE 'No referrer found';
    END IF;
END $$;

-- Step 4: Show final results
SELECT 'Updated balances:' as info;
SELECT full_name, balance FROM user_profiles WHERE full_name IN ('khan khan', 'testing');

SELECT 'Commission records:' as info;
SELECT 
    rc.commission_amount,
    rc.created_at,
    referrer.full_name as referrer_name,
    referred.full_name as referred_name
FROM referral_commissions rc
JOIN user_profiles referrer ON rc.referrer_id = referrer.id
JOIN user_profiles referred ON rc.referred_user_id = referred.id
ORDER BY rc.created_at DESC;
