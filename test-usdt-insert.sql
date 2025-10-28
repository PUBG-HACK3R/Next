-- Test USDT insert with debugging
-- Run this in Supabase SQL editor while logged in as the user

-- First, check current authentication
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'email' as user_email,
    auth.jwt() ->> 'role' as user_role;

-- Check if user exists in user_profiles
SELECT id, full_name, user_level, email
FROM user_profiles 
WHERE id = auth.uid();

-- Test the exact INSERT that's failing
-- This should show the exact error
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
    auth.uid(),  -- This should match the RLS policy
    10.0,
    2800.0,
    280.0,
    'TXYZabc123...',
    'TRC20',
    'test-transaction-hash-123',
    'test-proof-file.jpg',
    'pending'
);

-- If the above fails, try with a hardcoded user_id (replace with actual user ID)
-- INSERT INTO usdt_deposits (
--     user_id,
--     amount_usdt,
--     amount_pkr,
--     usdt_rate,
--     wallet_address,
--     chain_name,
--     transaction_hash,
--     proof_url,
--     status
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',  -- Replace with actual user ID
--     10.0,
--     2800.0,
--     280.0,
--     'TXYZabc123...',
--     'TRC20',
--     'test-transaction-hash-123',
--     'test-proof-file.jpg',
--     'pending'
-- );
