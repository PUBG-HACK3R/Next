-- Fix commission conflict - separate deposit and earnings commissions clearly

-- First, check what's causing the double commission
SELECT 
    'Checking recent commissions:' as info,
    rc.*,
    d.amount_pkr as deposit_amount,
    d.status as deposit_status
FROM referral_commissions rc
LEFT JOIN deposits d ON rc.deposit_id = d.id
WHERE rc.created_at > NOW() - INTERVAL '1 hour'
ORDER BY rc.created_at DESC;

-- Check if there are investment-related commissions being created incorrectly
SELECT 
    'Investment commissions:' as info,
    rc.*
FROM referral_commissions rc
WHERE rc.investment_id IS NOT NULL
AND rc.created_at > NOW() - INTERVAL '1 hour'
ORDER BY rc.created_at DESC;

-- Fix: Ensure deposit commissions ONLY happen on deposit approval
CREATE OR REPLACE FUNCTION calculate_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    referred_user_profile RECORD;
    level1_referrer_profile RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
    existing_commission_count INTEGER;
BEGIN
    -- ONLY process when deposit status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Check for existing DEPOSIT commissions (not earnings)
        SELECT COUNT(*) INTO existing_commission_count
        FROM referral_commissions 
        WHERE deposit_id = NEW.id 
        AND investment_id IS NULL; -- Only deposit commissions, not earnings
        
        IF existing_commission_count > 0 THEN
            RAISE NOTICE 'DEPOSIT commission already exists for deposit ID: %, skipping', NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE NOTICE 'Processing DEPOSIT commission for deposit ID: %, Amount: % PKR', 
            NEW.id, NEW.amount_pkr;
        
        -- Get admin settings
        SELECT referral_l1_deposit_percent 
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 DEPOSIT Commission only
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := NEW.amount_pkr * (COALESCE(admin_settings.referral_l1_deposit_percent, 5) / 100.0);
                
                RAISE NOTICE 'Creating L1 DEPOSIT commission: % PKR ({}%) for %', 
                    commission_amount, COALESCE(admin_settings.referral_l1_deposit_percent, 5), level1_referrer_profile.full_name;
                
                -- Insert DEPOSIT commission (NOT earnings)
                INSERT INTO referral_commissions (
                    referrer_id, 
                    referred_user_id, 
                    deposit_id,        -- This is a DEPOSIT commission
                    investment_id,     -- NULL for deposit commissions
                    commission_amount, 
                    commission_percent, 
                    level, 
                    status
                ) VALUES (
                    level1_referrer_profile.id, 
                    referred_user_profile.id, 
                    NEW.id,           -- deposit_id
                    NULL,             -- investment_id is NULL for deposit commissions
                    commission_amount, 
                    COALESCE(admin_settings.referral_l1_deposit_percent, 5), 
                    1, 
                    'Completed'
                );
                
                -- Update balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                RAISE NOTICE 'DEPOSIT commission created successfully';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits;
CREATE TRIGGER referral_commission_trigger
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_commissions();

-- Check final state
SELECT 'Commission system fixed - deposit and earnings are now separate' as status;

-- Show commission structure
SELECT 
    'Commission Structure:' as info
UNION ALL
SELECT 'DEPOSITS: L1 gets ' || COALESCE(referral_l1_deposit_percent, 5) || '% when deposit approved'
FROM admin_settings WHERE id = 1
UNION ALL  
SELECT 'EARNINGS: L1/L2/L3 get their % when daily income is collected'
FROM admin_settings WHERE id = 1;
