-- Quick debug to find the exact issue

-- Test manual insert with a unique email
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'debug-test-' || extract(epoch from now()) || '@example.com';
    test_name TEXT := 'Debug Test User';
    test_referral_code TEXT;
BEGIN
    -- Generate referral code
    SELECT generate_referral_code() INTO test_referral_code;
    
    RAISE NOTICE 'Testing insert with unique email: %', test_email;
    RAISE NOTICE 'Referral code: %', test_referral_code;
    
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
        NULL,
        test_referral_code,
        0,
        1
    );
    
    RAISE NOTICE 'SUCCESS: Insert worked!';
    
    -- Clean up
    DELETE FROM user_profiles WHERE id = test_user_id;
    RAISE NOTICE 'Cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: Insert error - %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
END $$;

-- Also check what happens if we try to insert with the same email as existing user
DO $$
BEGIN
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
        gen_random_uuid(), 
        'Duplicate Email Test',
        'rtwnoyan3@gmail.com',  -- Same email as existing user
        NULL,
        'ref999999',
        0,
        1
    );
    
    RAISE NOTICE 'Duplicate email insert somehow worked';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Duplicate email failed as expected: %', SQLERRM;
END $$;
