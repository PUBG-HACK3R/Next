-- Fix double commission issue - prevent duplicate commissions

-- First, let's see what triggers are currently active on deposits
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits'
ORDER BY trigger_name;

-- Check if there are duplicate commission records
SELECT 
    deposit_id,
    referrer_id,
    referred_user_id,
    commission_amount,
    level,
    status,
    created_at,
    COUNT(*) as duplicate_count
FROM referral_commissions 
GROUP BY deposit_id, referrer_id, referred_user_id, commission_amount, level, status, created_at
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- Check recent commission records to see duplicates
SELECT 
    rc.*,
    up_referrer.full_name as referrer_name,
    up_referred.full_name as referred_name,
    d.amount_pkr as deposit_amount
FROM referral_commissions rc
JOIN user_profiles up_referrer ON rc.referrer_id = up_referrer.id
JOIN user_profiles up_referred ON rc.referred_user_id = up_referred.id
LEFT JOIN deposits d ON rc.deposit_id = d.id
ORDER BY rc.created_at DESC
LIMIT 10;

-- Fix the trigger to prevent duplicate commissions
CREATE OR REPLACE FUNCTION calculate_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    referred_user_profile RECORD;
    level1_referrer_profile RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
    existing_commission_count INTEGER;
BEGIN
    -- Only process when deposit status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- CHECK FOR EXISTING COMMISSIONS TO PREVENT DUPLICATES
        SELECT COUNT(*) INTO existing_commission_count
        FROM referral_commissions 
        WHERE deposit_id = NEW.id;
        
        IF existing_commission_count > 0 THEN
            RAISE NOTICE 'Commission already exists for deposit ID: %, skipping', NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE NOTICE 'Processing referral commissions for deposit ID: %, Amount: % PKR', 
            NEW.id, NEW.amount_pkr;
        
        -- Get admin settings for commission percentages
        SELECT 
            referral_l1_percent, 
            referral_l2_percent, 
            referral_l3_percent,
            referral_l1_deposit_percent 
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        IF admin_settings IS NULL THEN
            RAISE NOTICE 'Admin settings not found';
            RETURN NEW;
        END IF;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        IF referred_user_profile IS NULL THEN
            RAISE NOTICE 'User profile not found for user_id: %', NEW.user_id;
            RETURN NEW;
        END IF;
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Commission (Direct referrer)
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                -- Use the correct deposit commission rate
                commission_amount := NEW.amount_pkr * (COALESCE(admin_settings.referral_l1_deposit_percent, 5) / 100.0);
                
                RAISE NOTICE 'Level 1 DEPOSIT commission: % PKR ({}%) for user %', 
                    commission_amount, COALESCE(admin_settings.referral_l1_deposit_percent, 5), level1_referrer_profile.full_name;
                
                -- Insert Level 1 commission (with duplicate check)
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, deposit_id, 
                    commission_amount, commission_percent, level, status
                ) 
                SELECT 
                    level1_referrer_profile.id, referred_user_profile.id, NEW.id,
                    commission_amount, COALESCE(admin_settings.referral_l1_deposit_percent, 5), 1, 'Completed'
                WHERE NOT EXISTS (
                    SELECT 1 FROM referral_commissions 
                    WHERE deposit_id = NEW.id 
                    AND referrer_id = level1_referrer_profile.id 
                    AND level = 1
                );
                
                -- Update referrer's balance (only if commission was inserted)
                IF FOUND THEN
                    UPDATE user_profiles 
                    SET balance = balance + commission_amount 
                    WHERE id = level1_referrer_profile.id;
                    
                    RAISE NOTICE 'Level 1 deposit commission processed successfully';
                ELSE
                    RAISE NOTICE 'Commission already exists, skipped duplicate';
                END IF;
            END IF;
        ELSE
            RAISE NOTICE 'User was not referred by anyone';
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in referral commission calculation: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check for any other commission triggers that might be causing duplicates
SELECT 
    'Active triggers on deposits table:' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'deposits'
AND trigger_name LIKE '%commission%';
