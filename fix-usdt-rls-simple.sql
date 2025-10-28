-- Simple fix for USDT RLS policy issues
-- This script focuses only on fixing the RLS policies

-- Disable RLS temporarily to clean up
ALTER TABLE usdt_deposits DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on usdt_deposits
DROP POLICY IF EXISTS "Users can view own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Users can insert own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can view all USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can manage all USDT deposits" ON usdt_deposits;

-- Re-enable RLS
ALTER TABLE usdt_deposits ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "usdt_deposits_select_policy" ON usdt_deposits
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

CREATE POLICY "usdt_deposits_insert_policy" ON usdt_deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usdt_deposits_update_policy" ON usdt_deposits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usdt_deposits';
