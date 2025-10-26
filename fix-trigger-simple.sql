-- Simple fix for the trigger function

-- First, let's check if the generate_referral_code function exists and works
SELECT generate_referral_code() as test_code;

-- Update the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referring_user_id UUID;
    new_referral_code TEXT;
BEGIN
    -- Generate referral code first
    SELECT generate_referral_code() INTO new_referral_code;
    
    -- If referred_by is a referral code, find the actual user ID
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        SELECT id INTO referring_user_id 
        FROM user_profiles 
        WHERE referral_code = NEW.raw_user_meta_data->>'referred_by';
    END IF;

    -- Insert user profile with all required fields
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
EXCEPTION
    WHEN OTHERS THEN
        -- Log the specific error
        RAISE LOG 'Error in handle_new_user for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        -- Re-raise the error so signup fails with details
        RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
