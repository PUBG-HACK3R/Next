-- Find EVERY possible source of RLS errors in the entire database
-- This will help us identify what's still causing the issue

-- 1. Check ALL tables in ALL schemas for RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as status
FROM pg_tables 
ORDER BY schemaname, tablename;

-- 2. Check ALL policies in the entire database
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
ORDER BY schemaname, tablename, policyname;

-- 3. Check auth schema specifically (Supabase auth tables)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 4. Check storage schema (Supabase storage tables)
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage'
ORDER BY tablename;

-- 5. Check for any functions that might enforce RLS
SELECT 
    routine_schema,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_definition ILIKE '%row%level%security%'
   OR routine_definition ILIKE '%rls%'
   OR routine_definition ILIKE '%policy%'
ORDER BY routine_schema, routine_name;

-- 6. Check for any triggers that might be causing issues
SELECT 
    event_object_schema,
    event_object_table,
    trigger_name,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema IN ('public', 'auth', 'storage')
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 7. Try a simple test insert to see the exact error
-- This will help us understand what's failing
SELECT 'Testing simple operations...' as test_status;

-- Test if we can even read from deposits table
SELECT COUNT(*) as deposit_count FROM deposits;

-- Test if we can read from user_profiles
SELECT COUNT(*) as user_count FROM user_profiles;
