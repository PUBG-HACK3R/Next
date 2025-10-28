-- Restore working RLS policies for USDT deposits now that authentication is fixed

-- Re-enable RLS on usdt_deposits
ALTER TABLE usdt_deposits ENABLE ROW LEVEL SECURITY;

-- Create working policies that should work with the fixed authentication
CREATE POLICY "usdt_deposits_user_select" ON usdt_deposits
    FOR SELECT USING (
        -- Users can see their own deposits
        auth.uid() = user_id OR
        -- Admins can see all deposits
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

CREATE POLICY "usdt_deposits_user_insert" ON usdt_deposits
    FOR INSERT WITH CHECK (
        -- Users can only insert with their own user_id
        auth.uid() = user_id
    );

CREATE POLICY "usdt_deposits_admin_update" ON usdt_deposits
    FOR UPDATE USING (
        -- Only admins can update deposits
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Test the policies by checking if we can see deposits
SELECT COUNT(*) as total_deposits FROM usdt_deposits;

-- Check if admin can see deposits (run this as admin user)
SELECT id, user_id, amount_usdt, status, created_at 
FROM usdt_deposits 
ORDER BY created_at DESC 
LIMIT 5;
