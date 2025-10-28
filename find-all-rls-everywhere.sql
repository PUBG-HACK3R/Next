-- Find EVERY table with RLS enabled in the entire database
-- The error must be coming from somewhere we haven't looked

-- 1. Check ALL tables in ALL schemas with RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY schemaname, tablename;

-- 2. Check if there are any tables in auth schema with RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 3. Check ALL policies in the entire database
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

-- 4. Check if there are any functions or triggers that might be causing RLS errors
SELECT 
    trigger_name,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table;
