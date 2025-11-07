-- Fix referral commission trigger to use amount_pkr instead of amount

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
    -- Only process when deposit status changes to 'approved' (not 'Completed')
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Get admin settings for commission percentages
        SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
        INTO admin_settings 
        FROM admin_settings 
        WHERE id = 1;
        
        -- Get the user who made the deposit
        SELECT * INTO referred_user_profile 
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        -- Check if user was referred by someone
        IF referred_user_profile.referred_by IS NOT NULL THEN
            
            -- Level 1 Commission (Direct referrer)
            SELECT * INTO level1_referrer_profile 
            FROM user_profiles 
            WHERE id = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                -- FIX: Use amount_pkr instead of amount
                commission_amount := NEW.amount_pkr * (admin_settings.referral_l1_percent / 100.0);
                
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
                
                -- Level 2 Commission (Referrer's referrer)
                IF level1_referrer_profile.referred_by IS NOT NULL THEN
                    SELECT * INTO level2_referrer_profile 
                    FROM user_profiles 
                    WHERE id = level1_referrer_profile.referred_by;
                    
                    IF level2_referrer_profile.id IS NOT NULL THEN
                        -- FIX: Use amount_pkr instead of amount
                        commission_amount := NEW.amount_pkr * (admin_settings.referral_l2_percent / 100.0);
                        
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
                                -- FIX: Use amount_pkr instead of amount
                                commission_amount := NEW.amount_pkr * (admin_settings.referral_l3_percent / 100.0);
                                
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
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly attached
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits;
CREATE TRIGGER referral_commission_trigger
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_commissions();
