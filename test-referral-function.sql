-- Test the referral code generation and user creation

-- 1. Test referral code generation
SELECT generate_referral_code() as test_code_1;
SELECT generate_referral_code() as test_code_2;
SELECT generate_referral_code() as test_code_3;

-- 2. Check existing referral codes
SELECT referral_code, COUNT(*) as count
FROM user_profiles 
GROUP BY referral_code
HAVING COUNT(*) > 1;

-- 3. Check if there are any null referral codes
SELECT COUNT(*) as users_without_referral_code
FROM user_profiles 
WHERE referral_code IS NULL;

-- 4. Test manual user profile creation (simulate what the trigger does)
-- This will help identify the exact issue
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test@example.com';
    test_name TEXT := 'Test User';
    new_referral_code TEXT;
BEGIN
    -- Generate referral code
    SELECT generate_referral_code() INTO new_referral_code;
    
    RAISE NOTICE 'Generated referral code: %', new_referral_code;
    
    -- Try to insert (this will fail if there's a constraint issue)
    INSERT INTO user_profiles (id, full_name, email, referral_code)
    VALUES (test_user_id, test_name, test_email, new_referral_code);
    
    RAISE NOTICE 'Test insert successful';
    
    -- Clean up test data
    DELETE FROM user_profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'Test completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed with error: %', SQLERRM;
END $$;
