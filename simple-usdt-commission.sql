-- Simple USDT commission system using the same logic as regular deposits
-- Just add USDT*PKR conversion

-- Add usdt_deposit_id to referral_commissions if it doesn't exist
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS usdt_deposit_id INTEGER REFERENCES usdt_deposits(id) ON DELETE CASCADE;

-- Make deposit_id nullable so we can have either deposit_id OR usdt_deposit_id
ALTER TABLE referral_commissions 
ALTER COLUMN deposit_id DROP NOT NULL;

-- Create USDT commission function (copy of the regular one, just using PKR amount)
CREATE OR REPLACE FUNCTION calculate_usdt_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    referrer_record RECORD;
    commission_l1 DECIMAL;
    commission_l2 DECIMAL;
    commission_l3 DECIMAL;
    settings_record RECORD;
    deposit_amount DECIMAL;
BEGIN
    -- Only calculate commissions when deposit is approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Get admin settings for commission percentages
        SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
        INTO settings_record
        FROM admin_settings 
        ORDER BY id DESC 
        LIMIT 1;
        
        IF NOT FOUND THEN
            RETURN NEW;
        END IF;
        
        -- Use PKR amount for commission calculation (USDT * PKR rate)
        deposit_amount := NEW.amount_pkr;
        
        -- Find Level 1 referrer (direct referrer)
        SELECT referred_by INTO referrer_record
        FROM user_profiles 
        WHERE id = NEW.user_id;
        
        -- Level 1 Commission
        IF referrer_record.referred_by IS NOT NULL THEN
            commission_l1 := deposit_amount * (settings_record.referral_l1_percent / 100.0);
            
            INSERT INTO referral_commissions (
                referrer_id, 
                referred_user_id, 
                usdt_deposit_id, 
                commission_amount, 
                commission_level, 
                commission_percent,
                created_at
            ) VALUES (
                referrer_record.referred_by,
                NEW.user_id,
                NEW.id,
                commission_l1,
                1,
                settings_record.referral_l1_percent,
                NOW()
            );
            
            -- Update referrer balance
            UPDATE user_profiles 
            SET balance = balance + commission_l1 
            WHERE id = referrer_record.referred_by;
            
            -- Level 2 Commission
            SELECT referred_by INTO referrer_record
            FROM user_profiles 
            WHERE id = referrer_record.referred_by;
            
            IF referrer_record.referred_by IS NOT NULL THEN
                commission_l2 := deposit_amount * (settings_record.referral_l2_percent / 100.0);
                
                INSERT INTO referral_commissions (
                    referrer_id, 
                    referred_user_id, 
                    usdt_deposit_id, 
                    commission_amount, 
                    commission_level, 
                    commission_percent,
                    created_at
                ) VALUES (
                    referrer_record.referred_by,
                    NEW.user_id,
                    NEW.id,
                    commission_l2,
                    2,
                    settings_record.referral_l2_percent,
                    NOW()
                );
                
                -- Update level 2 referrer balance
                UPDATE user_profiles 
                SET balance = balance + commission_l2 
                WHERE id = referrer_record.referred_by;
                
                -- Level 3 Commission
                SELECT referred_by INTO referrer_record
                FROM user_profiles 
                WHERE id = referrer_record.referred_by;
                
                IF referrer_record.referred_by IS NOT NULL THEN
                    commission_l3 := deposit_amount * (settings_record.referral_l3_percent / 100.0);
                    
                    INSERT INTO referral_commissions (
                        referrer_id, 
                        referred_user_id, 
                        usdt_deposit_id, 
                        commission_amount, 
                        commission_level, 
                        commission_percent,
                        created_at
                    ) VALUES (
                        referrer_record.referred_by,
                        NEW.user_id,
                        NEW.id,
                        commission_l3,
                        3,
                        settings_record.referral_l3_percent,
                        NOW()
                    );
                    
                    -- Update level 3 referrer balance
                    UPDATE user_profiles 
                    SET balance = balance + commission_l3 
                    WHERE id = referrer_record.referred_by;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for USDT deposits (same as regular deposits - on UPDATE)
DROP TRIGGER IF EXISTS trigger_calculate_usdt_referral_commissions ON usdt_deposits;
CREATE TRIGGER trigger_calculate_usdt_referral_commissions
    AFTER UPDATE ON usdt_deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_usdt_referral_commissions();

-- Done! Now USDT deposits will calculate commissions when approved, just like regular deposits
