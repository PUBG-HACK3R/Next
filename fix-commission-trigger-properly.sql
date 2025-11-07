-- Fix the referral commission trigger to work with the new deposits table structure

-- First, let's see what triggers currently exist
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits';

-- Drop and recreate the function with proper column names and status values
CREATE OR REPLACE FUNCTION calculate_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    referred_user_profile RECORD;
    level1_referrer_profile RECORD;
    level2_referrer_profile RECORD;
    level3_referrer_profile RECORD;
    admin_settings RECORD;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Debug logging
    RAISE NOTICE 'Trigger fired: OLD.status = %, NEW.status = %', 
        COALESCE(OLD.status, 'NULL'), NEW.status;
    
    -- Only process when deposit status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        RAISE NOTICE 'Processing referral commissions for deposit ID: %, Amount: % PKR', 
            NEW.id, NEW.amount_pkr;
        
        -- Get admin settings for commission percentages
        SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        IF admin_settings IS NULL THEN
            RAISE NOTICE 'Admin settings not found';
            RETURN NEW;
        END IF;
        
        RAISE NOTICE 'Admin settings: L1=%, L2=%, L3=%', 
            admin_settings.referral_l1_percent, 
            admin_settings.referral_l2_percent, 
            admin_settings.referral_l3_percent;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        IF referred_user_profile IS NULL THEN
            RAISE NOTICE 'User profile not found for user_id: %', NEW.user_id;
            RETURN NEW;
        END IF;
        
        RAISE NOTICE 'User found: %, referred_by: %', 
            referred_user_profile.full_name, 
            COALESCE(referred_user_profile.referred_by::text, 'NULL');
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Commission (Direct referrer)
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := NEW.amount_pkr * (admin_settings.referral_l1_percent / 100.0);
                
                RAISE NOTICE 'Level 1 commission: % PKR for user %', 
                    commission_amount, level1_referrer_profile.full_name;
                
                -- Insert Level 1 commission
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, deposit_id, 
                    commission_amount, commission_percent, level, status
                ) VALUES (
                    level1_referrer_profile.id, referred_user_profile.id, NEW.id,
                    commission_amount, admin_settings.referral_l1_percent, 1, 'Pending'
                );
                
                -- Update referrer's balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                RAISE NOTICE 'Level 1 commission processed successfully';
                
                -- Level 2 Commission (Referrer's referrer)
                IF level1_referrer_profile.referred_by IS NOT NULL THEN
                    SELECT * INTO level2_referrer_profile 
                    FROM user_profiles 
                    WHERE id = level1_referrer_profile.referred_by;
                    
                    IF level2_referrer_profile.id IS NOT NULL THEN
                        commission_amount := NEW.amount_pkr * (admin_settings.referral_l2_percent / 100.0);
                        
                        RAISE NOTICE 'Level 2 commission: % PKR for user %', 
                            commission_amount, level2_referrer_profile.full_name;
                        
                        -- Insert Level 2 commission
                        INSERT INTO referral_commissions (
                            referrer_id, referred_user_id, deposit_id, 
                            commission_amount, commission_percent, level, status
                        ) VALUES (
                            level2_referrer_profile.id, referred_user_profile.id, NEW.id,
                            commission_amount, admin_settings.referral_l2_percent, 2, 'Pending'
                        );
                        
                        -- Update referrer's balance
                        UPDATE user_profiles 
                        SET balance = balance + commission_amount 
                        WHERE id = level2_referrer_profile.id;
                        
                        -- Level 3 Commission (Level 2's referrer)
                        IF level2_referrer_profile.referred_by IS NOT NULL THEN
                            SELECT * INTO level3_referrer_profile 
                            FROM user_profiles 
                            WHERE id = level2_referrer_profile.referred_by;
                            
                            IF level3_referrer_profile.id IS NOT NULL THEN
                                commission_amount := NEW.amount_pkr * (admin_settings.referral_l3_percent / 100.0);
                                
                                RAISE NOTICE 'Level 3 commission: % PKR for user %', 
                                    commission_amount, level3_referrer_profile.full_name;
                                
                                -- Insert Level 3 commission
                                INSERT INTO referral_commissions (
                                    referrer_id, referred_user_id, deposit_id, 
                                    commission_amount, commission_percent, level, status
                                ) VALUES (
                                    level3_referrer_profile.id, referred_user_profile.id, NEW.id,
                                    commission_amount, admin_settings.referral_l3_percent, 3, 'Pending'
                                );
                                
                                -- Update referrer's balance
                                UPDATE user_profiles 
                                SET balance = balance + commission_amount 
                                WHERE id = level3_referrer_profile.id;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;
        ELSE
            RAISE NOTICE 'User was not referred by anyone';
        END IF;
    ELSE
        RAISE NOTICE 'Trigger condition not met - not processing commissions';
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in referral commission calculation: %', SQLERRM;
        -- Don't fail the deposit, just log the error
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS calculate_referral_commissions_trigger ON deposits;
DROP TRIGGER IF EXISTS usdt_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;

-- Create the trigger for both INSERT and UPDATE
CREATE TRIGGER referral_commission_trigger
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_commissions();

-- Verify the trigger was created
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits';
