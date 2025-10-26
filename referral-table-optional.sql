-- Optional: Create separate referral tracking table for detailed analytics
-- Only run this if you want detailed referral tracking beyond the basic system

-- Create referral_transactions table for detailed tracking
CREATE TABLE referral_transactions (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    deposit_id INTEGER REFERENCES deposits(id),
    commission_amount NUMERIC NOT NULL,
    commission_level INTEGER NOT NULL, -- 1, 2, or 3
    commission_percent NUMERIC NOT NULL,
    deposit_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for referral_transactions
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own referral earnings
CREATE POLICY "Users can view own referral earnings" ON referral_transactions
    FOR SELECT USING (referrer_id = auth.uid());

-- Admins can see all referral transactions
CREATE POLICY "Admins can view all referral transactions" ON referral_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Update the referral commission function to also log transactions
CREATE OR REPLACE FUNCTION process_referral_commissions(deposit_user_id UUID, deposit_amount NUMERIC, deposit_id INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    level1_user UUID;
    level2_user UUID;
    level3_user UUID;
    l1_percent NUMERIC;
    l2_percent NUMERIC;
    l3_percent NUMERIC;
    l1_amount NUMERIC;
    l2_amount NUMERIC;
    l3_amount NUMERIC;
BEGIN
    -- Get commission percentages from admin settings
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
    INTO l1_percent, l2_percent, l3_percent
    FROM admin_settings WHERE id = 1;
    
    -- Get level 1 referrer (direct referrer)
    SELECT referred_by INTO level1_user
    FROM user_profiles 
    WHERE id = deposit_user_id AND referred_by IS NOT NULL;
    
    -- Process Level 1 commission
    IF level1_user IS NOT NULL AND l1_percent > 0 THEN
        l1_amount := deposit_amount * l1_percent / 100;
        
        UPDATE user_profiles 
        SET balance = balance + l1_amount
        WHERE id = level1_user;
        
        -- Log the transaction
        INSERT INTO referral_transactions (referrer_id, referred_id, deposit_id, commission_amount, commission_level, commission_percent, deposit_amount)
        VALUES (level1_user, deposit_user_id, deposit_id, l1_amount, 1, l1_percent, deposit_amount);
        
        -- Get level 2 referrer (referrer of level 1)
        SELECT referred_by INTO level2_user
        FROM user_profiles 
        WHERE id = level1_user AND referred_by IS NOT NULL;
        
        -- Process Level 2 commission
        IF level2_user IS NOT NULL AND l2_percent > 0 THEN
            l2_amount := deposit_amount * l2_percent / 100;
            
            UPDATE user_profiles 
            SET balance = balance + l2_amount
            WHERE id = level2_user;
            
            -- Log the transaction
            INSERT INTO referral_transactions (referrer_id, referred_id, deposit_id, commission_amount, commission_level, commission_percent, deposit_amount)
            VALUES (level2_user, deposit_user_id, deposit_id, l2_amount, 2, l2_percent, deposit_amount);
            
            -- Get level 3 referrer (referrer of level 2)
            SELECT referred_by INTO level3_user
            FROM user_profiles 
            WHERE id = level2_user AND referred_by IS NOT NULL;
            
            -- Process Level 3 commission
            IF level3_user IS NOT NULL AND l3_percent > 0 THEN
                l3_amount := deposit_amount * l3_percent / 100;
                
                UPDATE user_profiles 
                SET balance = balance + l3_amount
                WHERE id = level3_user;
                
                -- Log the transaction
                INSERT INTO referral_transactions (referrer_id, referred_id, deposit_id, commission_amount, commission_level, commission_percent, deposit_amount)
                VALUES (level3_user, deposit_user_id, deposit_id, l3_amount, 3, l3_percent, deposit_amount);
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
