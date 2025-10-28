-- Add USDT deposits to the referral commission system
-- This will make USDT deposits trigger referral commissions

-- First, add a new column to referral_commissions for USDT deposits
ALTER TABLE referral_commissions 
ADD COLUMN usdt_deposit_id INTEGER REFERENCES usdt_deposits(id) ON DELETE CASCADE;

-- Make deposit_id nullable since we'll have either deposit_id OR usdt_deposit_id
ALTER TABLE referral_commissions 
ALTER COLUMN deposit_id DROP NOT NULL;

-- Add a constraint to ensure either deposit_id or usdt_deposit_id is set (but not both)
ALTER TABLE referral_commissions 
ADD CONSTRAINT check_deposit_type 
CHECK (
    (deposit_id IS NOT NULL AND usdt_deposit_id IS NULL) OR 
    (deposit_id IS NULL AND usdt_deposit_id IS NOT NULL)
);

-- Create function to calculate USDT referral commissions
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
    -- Get admin settings for commission percentages
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent 
    INTO settings_record
    FROM admin_settings 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No admin settings found, skipping commission calculation';
        RETURN NEW;
    END IF;
    
    -- Use PKR amount for commission calculation
    deposit_amount := NEW.amount_pkr;
    
    -- Find the user who made the deposit
    SELECT referred_by INTO referrer_record
    FROM user_profiles 
    WHERE id = NEW.user_id;
    
    -- Level 1 Commission (Direct referrer)
    IF referrer_record.referred_by IS NOT NULL THEN
        commission_l1 := deposit_amount * (settings_record.referral_l1_percent / 100.0);
        
        INSERT INTO referral_commissions (
            referrer_id, 
            referred_user_id, 
            usdt_deposit_id, 
            commission_amount, 
            commission_level, 
            commission_percent
        ) VALUES (
            referrer_record.referred_by,
            NEW.user_id,
            NEW.id,
            commission_l1,
            1,
            settings_record.referral_l1_percent
        );
        
        -- Update referrer balance
        UPDATE user_profiles 
        SET balance = balance + commission_l1 
        WHERE id = referrer_record.referred_by;
        
        -- Level 2 Commission (Referrer's referrer)
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
                commission_percent
            ) VALUES (
                referrer_record.referred_by,
                NEW.user_id,
                NEW.id,
                commission_l2,
                2,
                settings_record.referral_l2_percent
            );
            
            -- Update level 2 referrer balance
            UPDATE user_profiles 
            SET balance = balance + commission_l2 
            WHERE id = referrer_record.referred_by;
            
            -- Level 3 Commission (Level 2's referrer)
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
                    commission_percent
                ) VALUES (
                    referrer_record.referred_by,
                    NEW.user_id,
                    NEW.id,
                    commission_l3,
                    3,
                    settings_record.referral_l3_percent
                );
                
                -- Update level 3 referrer balance
                UPDATE user_profiles 
                SET balance = balance + commission_l3 
                WHERE id = referrer_record.referred_by;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for USDT deposits
DROP TRIGGER IF EXISTS trigger_calculate_usdt_referral_commissions ON usdt_deposits;
CREATE TRIGGER trigger_calculate_usdt_referral_commissions
    AFTER INSERT ON usdt_deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_usdt_referral_commissions();

-- Test the commission calculation on existing USDT deposits
-- This will calculate commissions for any existing USDT deposits that don't have commissions yet
DO $$
DECLARE
    deposit_record RECORD;
BEGIN
    FOR deposit_record IN 
        SELECT * FROM usdt_deposits 
        WHERE id NOT IN (SELECT COALESCE(usdt_deposit_id, 0) FROM referral_commissions WHERE usdt_deposit_id IS NOT NULL)
    LOOP
        -- Trigger the commission calculation for existing deposits
        PERFORM calculate_usdt_referral_commissions() FROM (SELECT deposit_record.*) AS NEW;
    END LOOP;
END $$;
