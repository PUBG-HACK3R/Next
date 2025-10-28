-- Debug USDT RLS issues
-- Run these queries to understand what's happening

-- 1. Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as user_email;

-- 2. Check if user exists in user_profiles
SELECT id, full_name, user_level 
FROM user_profiles 
WHERE id = auth.uid();

-- 3. Check current policies on usdt_deposits
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usdt_deposits';

-- 4. Test if we can insert a simple record (this will show the exact error)
-- Replace 'your-user-id-here' with actual user ID
/*
INSERT INTO usdt_deposits (
    user_id, 
    amount_usdt, 
    amount_pkr, 
    usdt_rate, 
    wallet_address, 
    chain_name, 
    transaction_hash, 
    proof_url, 
    status
) VALUES (
    auth.uid(),
    10.0,
    2800.0,
    280.0,
    'test-wallet',
    'TRC20',
    'test-hash',
    'test-proof.jpg',
    'pending'
);
*/

-- 5. Check table structure
\d usdt_deposits;
