-- Verify bonus_transactions table structure

-- Check all columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bonus_transactions'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bonus_transactions';

-- Try a simple insert to test
-- Replace 'YOUR_USER_ID' with an actual user ID from user_profiles
SELECT 'Testing insert with a real user_id:' as info;

-- Get a real user ID first
SELECT id, full_name FROM user_profiles LIMIT 1;
