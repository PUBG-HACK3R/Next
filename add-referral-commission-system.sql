-- Add referral commission system
-- This creates the referral_commissions table and triggers to automatically calculate commissions

-- First, verify that required tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'user_profiles table does not exist. Please create it first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deposits') THEN
        RAISE EXCEPTION 'deposits table does not exist. Please create it first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') THEN
        RAISE EXCEPTION 'admin_settings table does not exist. Please create it first.';
    END IF;
    
    RAISE NOTICE 'All required tables exist. Proceeding with referral commission system setup.';
END $$;

-- Drop existing table if it exists (to ensure clean creation)
DROP TABLE IF EXISTS referral_commissions CASCADE;

-- Create referral_commissions table
CREATE TABLE referral_commissions (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    deposit_id INTEGER REFERENCES deposits(id) ON DELETE CASCADE,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percent DECIMAL(5,2) NOT NULL,
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)), -- 1, 2, or 3
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred ON referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_deposit ON referral_commissions(deposit_id);

-- Function to calculate and create referral commissions
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
    -- Only process when deposit status changes to 'Completed'
    IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
        
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
            WHERE referral_code = referred_user_profile.referred_by;
            
            IF level1_referrer_profile.id IS NOT NULL THEN
                commission_amount := NEW.amount * (admin_settings.referral_l1_percent / 100.0);
                
                -- Insert Level 1 commission
                INSERT INTO referral_commissions (
                    referrer_id, referred_user_id, deposit_id, 
                    commission_amount, commission_percent, level, status
                ) VALUES (
                    level1_referrer_profile.id, referred_user_profile.id, NEW.id,
                    commission_amount, admin_settings.referral_l1_percent, 1, 'Completed'
                );
                
                -- Update referrer's balance
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = level1_referrer_profile.id;
                
                -- Level 2 Commission (Referrer's referrer)
                IF level1_referrer_profile.referred_by IS NOT NULL THEN
                    SELECT * INTO level2_referrer_profile 
                    FROM user_profiles 
                    WHERE referral_code = level1_referrer_profile.referred_by;
                    
                    IF level2_referrer_profile.id IS NOT NULL THEN
                        commission_amount := NEW.amount * (admin_settings.referral_l2_percent / 100.0);
                        
                        -- Insert Level 2 commission
                        INSERT INTO referral_commissions (
                            referrer_id, referred_user_id, deposit_id, 
                            commission_amount, commission_percent, level, status
                        ) VALUES (
                            level2_referrer_profile.id, referred_user_profile.id, NEW.id,
                            commission_amount, admin_settings.referral_l2_percent, 2, 'Completed'
                        );
                        
                        -- Update referrer's balance
                        UPDATE user_profiles 
                        SET balance = balance + commission_amount 
                        WHERE id = level2_referrer_profile.id;
                        
                        -- Level 3 Commission (Level 2 referrer's referrer)
                        IF level2_referrer_profile.referred_by IS NOT NULL THEN
                            SELECT * INTO level3_referrer_profile 
                            FROM user_profiles 
                            WHERE referral_code = level2_referrer_profile.referred_by;
                            
                            IF level3_referrer_profile.id IS NOT NULL THEN
                                commission_amount := NEW.amount * (admin_settings.referral_l3_percent / 100.0);
                                
                                -- Insert Level 3 commission
                                INSERT INTO referral_commissions (
                                    referrer_id, referred_user_id, deposit_id, 
                                    commission_amount, commission_percent, level, status
                                ) VALUES (
                                    level3_referrer_profile.id, referred_user_profile.id, NEW.id,
                                    commission_amount, admin_settings.referral_l3_percent, 3, 'Completed'
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate commissions on deposit completion
DROP TRIGGER IF EXISTS trigger_calculate_referral_commissions ON deposits;
CREATE TRIGGER trigger_calculate_referral_commissions
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION calculate_referral_commissions();

-- Add comments
COMMENT ON TABLE referral_commissions IS 'Stores referral commission records for all levels';
COMMENT ON FUNCTION calculate_referral_commissions() IS 'Automatically calculates and distributes referral commissions when deposits are completed';

-- Verify the setup
SELECT 'Referral commission system setup completed successfully' AS status;
