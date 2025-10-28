-- Debug all constraints and triggers on usdt_deposits table

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usdt_deposits' 
ORDER BY ordinal_position;

-- 2. Check all constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'usdt_deposits'::regclass;

-- 3. Check for triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'usdt_deposits';

-- 4. Check foreign key references
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'usdt_deposits';

-- 5. Test a simple insert with minimal data
INSERT INTO usdt_deposits (
    user_id,
    amount_usdt,
    amount_pkr,
    usdt_rate,
    wallet_address,
    chain_name,
    transaction_hash,
    proof_url
) VALUES (
    '00000000-0000-0000-0000-000000000000',  -- Replace with a real user ID
    1.0,
    280.0,
    280.0,
    'test-wallet',
    'TRC20',
    'test-hash',
    'test-proof.jpg'
);
