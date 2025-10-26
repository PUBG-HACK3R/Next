-- Safe fix for user_profiles table - handles existing constraints

-- Add email column to user_profiles table (if not exists)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop existing constraint if it exists, then recreate it
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    BEGIN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_email_unique;
    EXCEPTION
        WHEN undefined_object THEN
            -- Constraint doesn't exist, that's fine
            NULL;
    END;
    
    -- Add the constraint
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
END $$;

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

-- Update existing user profiles to include email from auth.users (only if email is null)
UPDATE user_profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE user_profiles.id = auth_users.id 
AND user_profiles.email IS NULL;

-- Make email NOT NULL only if all records have email values
DO $$
BEGIN
    -- Check if any records have null email
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email IS NULL) THEN
        ALTER TABLE user_profiles ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;
