-- Fix just the trigger function for user creation

-- Update the trigger function to handle email properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referring_user_id UUID;
BEGIN
    -- If referred_by is a referral code, find the actual user ID
    IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
        SELECT id INTO referring_user_id 
        FROM user_profiles 
        WHERE referral_code = NEW.raw_user_meta_data->>'referred_by';
    END IF;

    -- Insert user profile with email from auth.users
    INSERT INTO public.user_profiles (id, full_name, email, referred_by, referral_code)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        referring_user_id,
        generate_referral_code()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the referral code generation function
SELECT generate_referral_code() as test_referral_code;
