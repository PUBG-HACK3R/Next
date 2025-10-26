-- Debug the exact INSERT issue

-- 1. Check all constraints on user_profiles table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'user_profiles' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Check current data in user_profiles to see what might conflict
SELECT id, full_name, email, referral_code, balance, user_level 
FROM user_profiles;

-- 3. Test manual insert to see exact error
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'manual-test@example.com';
    test_name TEXT := 'Manual Test User';
    test_referral_code TEXT;
BEGIN
    -- Generate referral code
    SELECT generate_referral_code() INTO test_referral_code;
    
    RAISE NOTICE 'Attempting insert with:';
    RAISE NOTICE 'ID: %', test_user_id;
    RAISE NOTICE 'Email: %', test_email;
    RAISE NOTICE 'Name: %', test_name;
    RAISE NOTICE 'Referral Code: %', test_referral_code;
    
    -- Try the exact same insert as the trigger
    INSERT INTO public.user_profiles (
        id, 
        full_name, 
        email, 
        referred_by, 
        referral_code,
        balance,
        user_level
    )
    VALUES (
        test_user_id, 
        test_name,
        test_email,
        NULL,  -- no referrer
        test_referral_code,
        0,
        1
    );
    
    RAISE NOTICE 'Insert successful!';
    
    -- Clean up
    DELETE FROM user_profiles WHERE id = test_user_id;
    RAISE NOTICE 'Cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert failed with error: % - %', SQLSTATE, SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLERRM;
END $$;
