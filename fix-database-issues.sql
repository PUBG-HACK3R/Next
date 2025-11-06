-- Fix critical database issues

-- 1. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON user_profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);

-- 2. Add missing constraints
ALTER TABLE deposits 
ADD CONSTRAINT deposits_amount_pkr_max_check 
CHECK (amount_pkr <= 1000000); -- Max 1M PKR

ALTER TABLE withdrawals 
ADD CONSTRAINT withdrawals_amount_positive_check 
CHECK (amount > 0);

-- 3. Fix foreign key consistency (if needed)
-- Note: Only run this if you want to standardize on user_profiles(id)
-- ALTER TABLE deposits DROP CONSTRAINT deposits_user_id_fkey;
-- ALTER TABLE deposits ADD CONSTRAINT deposits_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES user_profiles(id);

-- 4. Add useful computed columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_invested NUMERIC DEFAULT 0;

-- 5. Create a view for user statistics (instead of computing every time)
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    up.id,
    up.full_name,
    up.balance,
    COALESCE(d.total_deposits, 0) as total_deposits,
    COALESCE(w.total_withdrawals, 0) as total_withdrawals,
    COALESCE(i.total_invested, 0) as total_invested,
    COALESCE(i.active_investments, 0) as active_investments
FROM user_profiles up
LEFT JOIN (
    SELECT user_id, SUM(amount_pkr) as total_deposits
    FROM deposits 
    WHERE status = 'approved'
    GROUP BY user_id
) d ON up.id = d.user_id
LEFT JOIN (
    SELECT user_id, SUM(amount) as total_withdrawals
    FROM withdrawals 
    WHERE status = 'approved'
    GROUP BY user_id
) w ON up.id = w.user_id
LEFT JOIN (
    SELECT user_id, 
           SUM(amount_invested) as total_invested,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_investments
    FROM investments 
    GROUP BY user_id
) i ON up.id = i.user_id;

-- 6. Add helpful functions
CREATE OR REPLACE FUNCTION get_user_total_deposits(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(amount_pkr) 
        FROM deposits 
        WHERE user_id = p_user_id AND status = 'approved'
    ), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_total_earnings(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE((
        SELECT SUM(i.amount_invested * p.profit_percent / 100)
        FROM investments i
        JOIN plans p ON i.plan_id = p.id
        WHERE i.user_id = p_user_id AND i.status = 'completed'
    ), 0);
END;
$$ LANGUAGE plpgsql;
