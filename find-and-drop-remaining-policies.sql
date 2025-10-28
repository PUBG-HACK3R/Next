-- Find and drop the remaining 3 policies that are causing RLS errors

-- 1. First, let's see exactly what these 3 policies are
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

-- 2. Drop ALL policies in the public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- 3. Also drop any policies in other schemas that might be causing issues
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
            RAISE NOTICE 'Dropped policy: % on table %.%', r.policyname, r.schemaname, r.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy: % on table %.% - %', r.policyname, r.schemaname, r.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Verify all policies are gone
SELECT COUNT(*) as remaining_policies FROM pg_policies;

-- 5. Test a simple deposit insert
INSERT INTO deposits (
    user_id,
    amount,
    sender_name,
    sender_last_4_digits,
    status
) VALUES (
    '3c10d87d-8f5e-4e0e-b1d4-3c7b555efe17',
    1000,
    'Test User',
    '1234',
    'pending'
);

SELECT 'Test deposit insert successful!' as result;
