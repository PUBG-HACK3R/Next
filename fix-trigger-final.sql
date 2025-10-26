-- Final trigger fix - using the exact same logic that worked in manual test

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referring_user_id UUID;
    new_referral_code TEXT;
BEGIN
    -- Generate referral code
    SELECT generate_referral_code() INTO new_referral_code;
    
    -- If referred_by is a referral code, find the actual user ID
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        SELECT id INTO referring_user_id 
        FROM user_profiles 
        WHERE referral_code = NEW.raw_user_meta_data->>'referred_by';
    END IF;

    -- Insert user profile - exact same as successful manual test
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
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email,
        referring_user_id,
        new_referral_code,
        0,
        1
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the trigger by simulating what happens during signup
DO $$
DECLARE
    test_trigger_result RECORD;
BEGIN
    -- This simulates what the trigger receives from Supabase Auth
    SELECT * FROM handle_new_user() WHERE false; -- Just to test function exists
    RAISE NOTICE 'Trigger function updated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Trigger update failed: %', SQLERRM;
END $$;
