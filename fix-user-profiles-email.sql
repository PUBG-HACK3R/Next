-- Fix user_profiles table - Add email column and update trigger

-- Add email column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Make email column unique
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

-- Update the trigger function to include email
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing user profiles to include email from auth.users
UPDATE user_profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND user_profiles.email IS NULL;

-- Add NOT NULL constraint to email after updating existing records
ALTER TABLE user_profiles ALTER COLUMN email SET NOT NULL;
