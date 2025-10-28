-- Fix RLS policies for deposits table
-- This addresses the "new row violates row-level security policy" error

-- First, check if the deposits table exists and has RLS enabled
-- If you get errors, it means the fresh-deposit-system.sql hasn't been run yet

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_create_own_deposits" ON deposits;
DROP POLICY IF EXISTS "users_view_own_deposits" ON deposits;
DROP POLICY IF EXISTS "admins_manage_all_deposits" ON deposits;

-- Temporarily disable RLS to test (REMOVE THIS AFTER TESTING)
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Create new working policies
CREATE POLICY "users_can_insert_deposits" ON deposits
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_view_own_deposits" ON deposits
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_deposits" ON deposits
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "admins_can_manage_all_deposits" ON deposits
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Grant necessary permissions
GRANT INSERT, SELECT, UPDATE ON deposits TO authenticated;
GRANT USAGE ON SEQUENCE deposits_id_seq TO authenticated;

-- Test the policy by trying to insert a test record (this should work now)
-- You can run this manually to test:
-- INSERT INTO deposits (user_id, deposit_type, amount_pkr, status) 
-- VALUES (auth.uid(), 'bank', 1000, 'pending');
