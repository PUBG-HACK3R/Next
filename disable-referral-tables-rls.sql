-- Disable RLS on referral-related tables that the trigger function accesses

-- Check if referral_commissions table has RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'referral_commissions';

-- Disable RLS on referral_commissions if it exists
ALTER TABLE referral_commissions DISABLE ROW LEVEL SECURITY;

-- Also check the function definition to see what it does
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'calculate_referral_commissions';

-- Verify all related tables have RLS disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('referral_commissions', 'user_profiles', 'deposits')
ORDER BY tablename;
