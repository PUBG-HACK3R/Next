-- Add commission records to transaction history
-- This will create transaction records for referral commissions

-- Step 1: Check current transaction tables
SELECT 'Checking transaction tables...' as info;

-- Check if transactions table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('transactions', 'transaction_history', 'user_transactions')
ORDER BY table_name, ordinal_position;

-- Step 2: Show current commission records
SELECT 'Current commission records:' as info;
SELECT 
    rc.id,
    rc.commission_amount,
    rc.level,
    rc.status,
    rc.created_at,
    referrer.full_name as referrer_name,
    referred.full_name as referred_name
FROM referral_commissions rc
JOIN user_profiles referrer ON rc.referrer_id = referrer.id
JOIN user_profiles referred ON rc.referred_user_id = referred.id
ORDER BY rc.created_at DESC;

-- Step 3: Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'commission', 'investment', etc.
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Completed',
    description TEXT,
    reference_id INTEGER, -- Can reference deposit_id, withdrawal_id, commission_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Step 4: Insert commission transactions
INSERT INTO transactions (user_id, type, amount, status, description, reference_id, created_at)
SELECT 
    rc.referrer_id,
    'commission',
    rc.commission_amount,
    'Completed',
    CONCAT('Level ', rc.level, ' referral commission from ', referred.full_name),
    rc.id,
    rc.created_at
FROM referral_commissions rc
JOIN user_profiles referred ON rc.referred_user_id = referred.id
WHERE NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.user_id = rc.referrer_id 
    AND t.type = 'commission' 
    AND t.reference_id = rc.id
);

-- Step 5: Show final transaction history
SELECT 'Updated transaction history:' as info;
SELECT 
    t.id,
    t.type,
    t.amount,
    t.status,
    t.description,
    t.created_at,
    up.full_name as user_name
FROM transactions t
JOIN user_profiles up ON t.user_id = up.id
WHERE up.full_name IN ('khan khan', 'testing')
ORDER BY t.created_at DESC
LIMIT 10;

-- Step 6: Show balance verification
SELECT 'Balance verification:' as info;
SELECT 
    up.full_name,
    up.balance as current_balance,
    COALESCE(SUM(CASE WHEN t.type IN ('deposit', 'commission') THEN t.amount ELSE 0 END), 0) as total_credits,
    COALESCE(SUM(CASE WHEN t.type IN ('withdrawal', 'investment') THEN t.amount ELSE 0 END), 0) as total_debits
FROM user_profiles up
LEFT JOIN transactions t ON up.id = t.user_id AND t.status = 'Completed'
WHERE up.full_name IN ('khan khan', 'testing')
GROUP BY up.id, up.full_name, up.balance;
