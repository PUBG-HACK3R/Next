-- Force admin_id to be nullable

-- First check current state
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'bonus_transactions'
AND column_name = 'admin_id';

-- Drop the NOT NULL constraint
ALTER TABLE bonus_transactions 
ALTER COLUMN admin_id DROP NOT NULL;

-- Verify it worked
SELECT 
    'After change:' as info,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'bonus_transactions'
AND column_name = 'admin_id';

-- Test insert with NULL admin_id
-- Get a real user ID first
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
    
    INSERT INTO bonus_transactions (user_id, admin_id, amount, reason, status)
    VALUES (test_user_id, NULL, 50, 'Test bonus with NULL admin', 'completed');
    
    RAISE NOTICE 'Test insert successful with user_id: %', test_user_id;
END $$;

-- Check if test insert worked
SELECT * FROM bonus_transactions 
WHERE reason = 'Test bonus with NULL admin'
ORDER BY created_at DESC 
LIMIT 1;
