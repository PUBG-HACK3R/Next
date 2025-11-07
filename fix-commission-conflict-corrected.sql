-- Fix commission conflict - corrected for actual table structure

-- First, check what columns exist in referral_commissions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
ORDER BY ordinal_position;

-- Check recent commissions to see the pattern
SELECT 
    'Recent commissions:' as info,
    rc.*,
    d.amount_pkr as deposit_amount,
    d.status as deposit_status
FROM referral_commissions rc
LEFT JOIN deposits d ON rc.deposit_id = d.id
WHERE rc.created_at > NOW() - INTERVAL '1 hour'
ORDER BY rc.created_at DESC;

-- Fix: Ensure deposit commissions ONLY happen once per deposit
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
        
        -- Check for existing commissions for this deposit
        SELECT COUNT(*) INTO existing_commission_count
        FROM referral_commissions 
        WHERE deposit_id = NEW.id;
        
        IF existing_commission_count > 0 THEN
            RAISE NOTICE 'Commission already exists for deposit ID: %, skipping to prevent duplicate', NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE NOTICE 'Processing referral commission for deposit ID: %, Amount: % PKR', 
            NEW.id, NEW.amount_pkr;
        
        -- Get admin settings for deposit commission rate
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
            
            -- Level 1 Commission only (for deposits)
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := NEW.amount_pkr * (COALESCE(admin_settings.referral_l1_deposit_percent, 5) / 100.0);
                
                RAISE NOTICE 'Creating L1 commission: % PKR ({}%) for %', 
                    commission_amount, COALESCE(admin_settings.referral_l1_deposit_percent, 5), level1_referrer_profile.full_name;
                
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
                    level1_referrer_profile.id, 
                    referred_user_profile.id, 
                    NEW.id,
                    commission_amount, 
                    COALESCE(admin_settings.referral_l1_deposit_percent, 5), 
                    1, 
                    'Completed'
                );
                
                -- Update referrer balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                RAISE NOTICE 'Commission processed successfully';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove any duplicate triggers
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS calculate_referral_commissions_trigger ON deposits;
DROP TRIGGER IF EXISTS usdt_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;

-- Create single clean trigger
CREATE TRIGGER referral_commission_trigger
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_commissions();

-- Verify only one trigger exists
SELECT 
    'Active commission triggers:' as info,
    trigger_name, 
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'deposits'
AND trigger_name LIKE '%commission%';

-- Clean up any duplicate commission records from today
DELETE FROM referral_commissions 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY deposit_id, referrer_id, level, DATE(created_at) 
                   ORDER BY created_at DESC
               ) as rn
        FROM referral_commissions
        WHERE created_at >= CURRENT_DATE
    ) t 
    WHERE rn > 1
);

SELECT 'Double commission issue fixed!' as status;
