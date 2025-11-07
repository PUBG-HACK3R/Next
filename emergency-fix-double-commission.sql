-- Emergency fix for double commission issue

-- Step 1: Drop ALL commission-related triggers to stop duplicates
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS calculate_referral_commissions_trigger ON deposits;
DROP TRIGGER IF EXISTS usdt_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS process_referral_commissions_trigger ON deposits;

-- Step 2: Check what triggers remain
SELECT 'Remaining triggers after cleanup:' as info;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits'
ORDER BY trigger_name;

-- Step 3: Create ONE clean trigger with duplicate prevention
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
        
        -- CRITICAL: Check for existing commissions to prevent duplicates
        SELECT COUNT(*) INTO existing_commission_count
        FROM referral_commissions 
        WHERE deposit_id = NEW.id AND level = 1;
        
        IF existing_commission_count > 0 THEN
            RAISE NOTICE 'Commission already exists for deposit ID: %, skipping to prevent duplicate', NEW.id;
            RETURN NEW;
        END IF;
        
        RAISE NOTICE 'Processing NEW referral commission for deposit ID: %, Amount: % PKR', 
            NEW.id, NEW.amount_pkr;
        
        -- Get admin settings
        SELECT 
            referral_l1_deposit_percent 
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Commission only
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := NEW.amount_pkr * (COALESCE(admin_settings.referral_l1_deposit_percent, 5) / 100.0);
                
                RAISE NOTICE 'Creating L1 commission: % PKR for %', 
                    commission_amount, level1_referrer_profile.full_name;
                
                -- Insert commission with additional duplicate check
                BEGIN
                    INSERT INTO referral_commissions (
                        referrer_id, referred_user_id, deposit_id, 
                        commission_amount, commission_percent, level, status
                    ) VALUES (
                        level1_referrer_profile.id, referred_user_profile.id, NEW.id,
                        commission_amount, COALESCE(admin_settings.referral_l1_deposit_percent, 5), 1, 'Completed'
                    );
                    
                    -- Update balance only if insert succeeded
                    UPDATE user_profiles 
                    SET balance = balance + commission_amount 
                    WHERE id = level1_referrer_profile.id;
                    
                    RAISE NOTICE 'Commission created successfully';
                    
                EXCEPTION
                    WHEN unique_violation THEN
                        RAISE NOTICE 'Duplicate commission prevented by constraint';
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Error creating commission: %', SQLERRM;
                END;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create ONE trigger only
CREATE TRIGGER referral_commission_trigger
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_commissions();

-- Step 5: Verify only one trigger exists
SELECT 'Final trigger check:' as info;
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits'
AND trigger_name LIKE '%commission%';

-- Step 6: Clean up existing duplicate commissions (optional)
-- This will remove duplicate commission records with same deposit_id, referrer_id, level
DELETE FROM referral_commissions 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY deposit_id, referrer_id, level ORDER BY created_at DESC) as rn
        FROM referral_commissions
    ) t 
    WHERE rn > 1
);

SELECT 'Double commission fix completed!' as status;
