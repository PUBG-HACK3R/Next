-- Restore proper RLS policies for USDT deposits
-- Now that we fixed the authentication issue

-- Re-enable RLS
ALTER TABLE usdt_deposits ENABLE ROW LEVEL SECURITY;

-- Create working policies
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

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usdt_deposits';
