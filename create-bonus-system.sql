-- Create bonus system for admin to give bonuses to users

-- Create bonus_transactions table
CREATE TABLE IF NOT EXISTS bonus_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    reason TEXT DEFAULT 'Admin bonus',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bonus_transactions_user_id ON bonus_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_transactions_admin_id ON bonus_transactions(admin_id);
CREATE INDEX IF NOT EXISTS idx_bonus_transactions_created_at ON bonus_transactions(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_bonus_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bonus_transactions_updated_at
    BEFORE UPDATE ON bonus_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_bonus_transactions_updated_at();

-- Add RLS policies
ALTER TABLE bonus_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own bonus transactions
CREATE POLICY "Users can view own bonus transactions" ON bonus_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view and manage all bonus transactions
CREATE POLICY "Admins can manage all bonus transactions" ON bonus_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 5
        )
    );

-- Create a view for transaction history that includes bonuses
CREATE OR REPLACE VIEW user_transaction_history AS
SELECT 
    'deposit' as transaction_type,
    d.id,
    d.user_id,
    d.amount_pkr as amount,
    d.status,
    'Deposit' as description,
    d.created_at,
    d.updated_at
FROM deposits d
UNION ALL
SELECT 
    'withdrawal' as transaction_type,
    w.id,
    w.user_id,
    w.amount,
    w.status,
    'Withdrawal' as description,
    w.created_at,
    w.updated_at
FROM withdrawals w
UNION ALL
SELECT 
    'referral_commission' as transaction_type,
    rc.id,
    rc.referrer_id as user_id,
    rc.commission_amount as amount,
    rc.status,
    CONCAT('Level ', rc.level, ' referral commission') as description,
    rc.created_at,
    rc.created_at as updated_at
FROM referral_commissions rc
UNION ALL
SELECT 
    'bonus' as transaction_type,
    bt.id,
    bt.user_id,
    bt.amount,
    bt.status,
    CONCAT('Bonus: ', bt.reason) as description,
    bt.created_at,
    bt.updated_at
FROM bonus_transactions bt
ORDER BY created_at DESC;

-- Grant permissions
GRANT SELECT ON user_transaction_history TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE bonus_transactions IS 'Admin bonus transactions - allows admins to give bonuses to users';
COMMENT ON VIEW user_transaction_history IS 'Complete transaction history including deposits, withdrawals, commissions, and bonuses';

-- Verify the table was created
SELECT 'Bonus system created successfully!' as status;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bonus_transactions'
ORDER BY ordinal_position;
