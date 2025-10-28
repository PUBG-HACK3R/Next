-- Restore RLS on all tables now that authentication is working

-- Re-enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Create working policies for user_profiles
CREATE POLICY "user_profiles_own_select" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_admin_all" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Restore deposits policies
CREATE POLICY "deposits_own_select" ON deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "deposits_own_insert" ON deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deposits_admin_all" ON deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Test if we can access data
SELECT COUNT(*) as total_usdt_deposits FROM usdt_deposits;
SELECT COUNT(*) as total_user_profiles FROM user_profiles;
