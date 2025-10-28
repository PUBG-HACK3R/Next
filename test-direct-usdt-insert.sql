-- Test direct USDT insert to see if the error is really from this table
-- This will help us isolate where the RLS error is actually coming from

-- First, check if usdt_deposits table actually exists and has RLS disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'usdt_deposits';

-- Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usdt_deposits' 
ORDER BY ordinal_position;

-- Try a direct INSERT with hardcoded values (replace user_id with a real one)
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
    '3c10d87d-8f5e-4e0e-b1d4-3c7b555efe17',  -- Use the real user ID from earlier
    10.0,
    2800.0,
    280.0,
    'test-wallet-address',
    'TRC20',
    'test-transaction-hash-123',
    'test-proof-file.jpg',
    'pending'
);

-- If this works, the issue is in the frontend
-- If this fails, the issue is in the database
