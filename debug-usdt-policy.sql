-- Debug USDT policy - make it more permissive temporarily
-- This will help us understand what's happening

-- Drop the current INSERT policy and any existing debug policy
DROP POLICY IF EXISTS "usdt_deposits_insert_policy" ON usdt_deposits;
DROP POLICY IF EXISTS "usdt_deposits_insert_debug" ON usdt_deposits;

-- Create a more permissive policy for debugging
CREATE POLICY "usdt_deposits_insert_debug" ON usdt_deposits
    FOR INSERT WITH CHECK (
        -- Allow insert if user_id is provided (even if auth.uid() is null)
        user_id IS NOT NULL
    );

-- Test this and see if USDT deposits work now
-- If they do, the issue is with auth.uid() being null

-- After testing, you can restore the proper policy with:
-- DROP POLICY IF EXISTS "usdt_deposits_insert_debug" ON usdt_deposits;
-- CREATE POLICY "usdt_deposits_insert_policy" ON usdt_deposits
--     FOR INSERT WITH CHECK (auth.uid() = user_id);
