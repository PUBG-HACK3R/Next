-- Fix admin_id to be nullable so bonus transactions can be created

-- Make admin_id nullable
ALTER TABLE bonus_transactions 
ALTER COLUMN admin_id DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bonus_transactions'
AND column_name = 'admin_id';

-- Now test creating a bonus transaction manually
INSERT INTO bonus_transactions (user_id, admin_id, amount, reason, status)
VALUES (
    auth.uid(),  -- Current user
    NULL,        -- NULL admin_id is now allowed
    100,
    'Test bonus',
    'completed'
);

-- Check if it was created
SELECT * FROM bonus_transactions 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
