-- Manual commission payment script
-- This will manually calculate and pay commissions for completed deposits

DO $$
DECLARE
    deposit_record RECORD;
    referred_user RECORD;
    referrer_user RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
    existing_commission RECORD;
BEGIN
    -- Get admin settings
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
    INTO admin_settings 
    FROM admin_settings WHERE id = 1;
    
    RAISE NOTICE 'Commission rates - L1: %, L2: %, L3: %', 
        admin_settings.referral_l1_percent, 
        admin_settings.referral_l2_percent, 
        admin_settings.referral_l3_percent;
    
    -- Process each completed deposit
    FOR deposit_record IN 
        SELECT d.*, up.referred_by, up.full_name as depositor_name
        FROM deposits d
        JOIN user_profiles up ON d.user_id = up.id
        WHERE d.status = 'Completed' 
        AND up.referred_by IS NOT NULL
        ORDER BY d.created_at ASC
    LOOP
        RAISE NOTICE 'Processing deposit: ID=%, Amount=%, User=%, Referred_by=%', 
            deposit_record.id, deposit_record.amount, deposit_record.depositor_name, deposit_record.referred_by;
        
        -- Check if commission already exists
        SELECT * INTO existing_commission 
        FROM referral_commissions 
        WHERE deposit_id = deposit_record.id;
        
        IF existing_commission.id IS NOT NULL THEN
            RAISE NOTICE 'Commission already exists for deposit %, skipping...', deposit_record.id;
            CONTINUE;
        END IF;
        
        -- Find the referrer (Level 1)
        SELECT * INTO referrer_user 
        FROM user_profiles 
        WHERE id = deposit_record.referred_by;
        
        IF referrer_user.id IS NOT NULL THEN
            commission_amount := deposit_record.amount * (admin_settings.referral_l1_percent / 100.0);
            
            RAISE NOTICE 'Paying L1 commission: % to % (ID: %)', 
                commission_amount, referrer_user.full_name, referrer_user.id;
            
            -- Insert commission record
            INSERT INTO referral_commissions (
                referrer_id, 
                referred_user_id, 
                deposit_id, 
                commission_amount, 
                commission_percent, 
                level, 
                status,
                created_at
            ) VALUES (
                referrer_user.id,
                deposit_record.user_id,
                deposit_record.id,
                commission_amount,
                admin_settings.referral_l1_percent,
                1,
                'Completed',
                NOW()
            );
            
            -- Update referrer's balance
            UPDATE user_profiles 
            SET balance = balance + commission_amount 
            WHERE id = referrer_user.id;
            
            RAISE NOTICE 'Commission paid successfully: % added to %', 
                commission_amount, referrer_user.full_name;
            
        ELSE
            RAISE NOTICE 'ERROR: No referrer found for referred_by ID: %', deposit_record.referred_by;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Manual commission processing completed!';
END $$;

-- Show final results
SELECT 'Final commission summary:' as summary;
SELECT 
    referrer.full_name as referrer_name,
    referrer.balance as current_balance,
    COUNT(rc.id) as total_commissions,
    SUM(rc.commission_amount) as total_earned
FROM user_profiles referrer
LEFT JOIN referral_commissions rc ON rc.referrer_id = referrer.id
WHERE referrer.id IN (
    SELECT DISTINCT referred_by 
    FROM user_profiles 
    WHERE referred_by IS NOT NULL
)
GROUP BY referrer.id, referrer.full_name, referrer.balance
ORDER BY total_earned DESC;
