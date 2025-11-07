-- Fix deposit commission to use the correct 5% rate instead of 10%

-- First check current admin settings
SELECT 
    referral_l1_percent as l1_earnings_percent,
    referral_l1_deposit_percent as l1_deposit_percent,
    referral_l2_percent as l2_earnings_percent,
    referral_l3_percent as l3_earnings_percent
FROM admin_settings WHERE id = 1;

-- Update the referral commission trigger to use the correct deposit commission rate
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
        
        -- Get admin settings for commission percentages (including separate deposit commission rate)
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
        
        RAISE NOTICE 'Admin settings: L1_earnings=%, L1_deposit=%, L2=%, L3=%', 
            admin_settings.referral_l1_percent,
            admin_settings.referral_l1_deposit_percent, 
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
            
            -- Level 1 Commission (Direct referrer) - USE DEPOSIT COMMISSION RATE
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                -- FIX: Use referral_l1_deposit_percent (5%) instead of referral_l1_percent (10%)
                commission_amount := NEW.amount_pkr * (admin_settings.referral_l1_deposit_percent / 100.0);
                
                RAISE NOTICE 'Level 1 DEPOSIT commission: % PKR ({}%) for user %', 
                    commission_amount, admin_settings.referral_l1_deposit_percent, level1_referrer_profile.full_name;
                
                -- Insert Level 1 commission with correct percentage
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, deposit_id, 
                    commission_amount, commission_percent, level, status
                ) VALUES (
                    level1_referrer_profile.id, referred_user_profile.id, NEW.id,
                    commission_amount, admin_settings.referral_l1_deposit_percent, 1, 'Pending'
                );
                
                -- Update referrer's balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                RAISE NOTICE 'Level 1 deposit commission processed successfully';
                
                -- NOTE: For deposits, only L1 gets commission
                -- L2 and L3 only get commissions from earnings, not deposits
                
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

-- Verify the admin settings
SELECT 
    'Current Commission Rates:' as info,
    referral_l1_deposit_percent || '% for L1 deposits' as l1_deposit,
    referral_l1_percent || '% for L1 earnings' as l1_earnings,
    referral_l2_percent || '% for L2 earnings' as l2_earnings,
    referral_l3_percent || '% for L3 earnings' as l3_earnings
FROM admin_settings WHERE id = 1;
