-- TEMPORARY: Disable RLS for testing deposits
-- WARNING: This removes security - only use for testing!

-- Disable RLS on deposits table temporarily
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON deposits TO authenticated;
GRANT USAGE ON SEQUENCE deposits_id_seq TO authenticated;

-- You can now test deposits without RLS issues
-- REMEMBER to run fix-deposit-rls.sql after testing to re-enable security!
