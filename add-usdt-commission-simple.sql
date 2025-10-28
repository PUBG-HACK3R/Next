-- Simpler approach: Add USDT commission system without strict constraints
-- This avoids constraint violations with existing data

-- Add usdt_deposit_id column (without constraint for now)
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS usdt_deposit_id INTEGER;

-- Add foreign key reference separately (this won't fail if column exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'referral_commissions_usdt_deposit_id_fkey'
    ) THEN
        ALTER TABLE referral_commissions 
        ADD CONSTRAINT referral_commissions_usdt_deposit_id_fkey 
        FOREIGN KEY (usdt_deposit_id) REFERENCES usdt_deposits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Make deposit_id nullable if it isn't already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_commissions' 
        AND column_name = 'deposit_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE referral_commissions ALTER COLUMN deposit_id DROP NOT NULL;
    END IF;
END $$;

-- Create the USDT commission calculation function
CREATE OR REPLACE FUNCTION calculate_usdt_referral_commissions()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    referrer_id UUID;
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
    current_user_id := NEW.user_id;
    
    -- Find Level 1 referrer (direct referrer)
    SELECT referred_by INTO referrer_id
    FROM user_profiles 
    WHERE id = current_user_id;
    
    -- Level 1 Commission (Direct referrer)
    IF referrer_id IS NOT NULL THEN
        commission_l1 := deposit_amount * (settings_record.referral_l1_percent / 100.0);
        
        INSERT INTO referral_commissions (
            referrer_id, 
            referred_user_id, 
            usdt_deposit_id, 
            commission_amount, 
            commission_level, 
            commission_percent
        ) VALUES (
            referrer_id,
            current_user_id,
            NEW.id,
            commission_l1,
            1,
            settings_record.referral_l1_percent
        );
        
        -- Update referrer balance
        UPDATE user_profiles 
        SET balance = balance + commission_l1 
        WHERE id = referrer_id;
        
        RAISE NOTICE 'L1 Commission: % PKR to user %', commission_l1, referrer_id;
        
        -- Level 2 Commission (Referrer's referrer)
        SELECT referred_by INTO referrer_id
        FROM user_profiles 
        WHERE id = referrer_id;
        
        IF referrer_id IS NOT NULL THEN
            commission_l2 := deposit_amount * (settings_record.referral_l2_percent / 100.0);
            
            INSERT INTO referral_commissions (
                referrer_id, 
                referred_user_id, 
                usdt_deposit_id, 
                commission_amount, 
                commission_level, 
                commission_percent
            ) VALUES (
                referrer_id,
                current_user_id,
                NEW.id,
                commission_l2,
                2,
                settings_record.referral_l2_percent
            );
            
            -- Update level 2 referrer balance
            UPDATE user_profiles 
            SET balance = balance + commission_l2 
            WHERE id = referrer_id;
            
            RAISE NOTICE 'L2 Commission: % PKR to user %', commission_l2, referrer_id;
            
            -- Level 3 Commission (Level 2's referrer)
            SELECT referred_by INTO referrer_id
            FROM user_profiles 
            WHERE id = referrer_id;
            
            IF referrer_id IS NOT NULL THEN
                commission_l3 := deposit_amount * (settings_record.referral_l3_percent / 100.0);
                
                INSERT INTO referral_commissions (
                    referrer_id, 
                    referred_user_id, 
                    usdt_deposit_id, 
                    commission_amount, 
                    commission_level, 
                    commission_percent
                ) VALUES (
                    referrer_id,
                    current_user_id,
                    NEW.id,
                    commission_l3,
                    3,
                    settings_record.referral_l3_percent
                );
                
                -- Update level 3 referrer balance
                UPDATE user_profiles 
                SET balance = balance + commission_l3 
                WHERE id = referrer_id;
                
                RAISE NOTICE 'L3 Commission: % PKR to user %', commission_l3, referrer_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for USDT deposits (only if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_calculate_usdt_referral_commissions ON usdt_deposits;
CREATE TRIGGER trigger_calculate_usdt_referral_commissions
    AFTER INSERT ON usdt_deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_usdt_referral_commissions();

-- Check current commission settings
SELECT 
    referral_l1_percent,
    referral_l2_percent, 
    referral_l3_percent
FROM admin_settings 
ORDER BY id DESC 
LIMIT 1;
