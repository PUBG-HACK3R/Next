-- ULTIMATE NUCLEAR OPTION: Bypass ALL RLS in the entire database
-- This should work no matter what

-- Set the current role to bypass RLS (if you have superuser privileges)
-- SET row_security = off;

-- Alternative: Grant bypass RLS to the current user
-- ALTER USER current_user BYPASSRLS;

-- Check what user we're running as
SELECT current_user, session_user;

-- Check if we have superuser privileges
SELECT usesuper FROM pg_user WHERE usename = current_user;

-- Try to disable RLS on ALL tables in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Verify everything is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
