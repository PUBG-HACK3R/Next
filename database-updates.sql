-- SmartGrow Mining Database Updates
-- Run these commands in Supabase SQL Editor to add elegant referral system

-- Step 1: Add referral_code column to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN referral_code TEXT UNIQUE;

-- Step 2: Create function to generate elegant referral codes (ref123456 format)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a 6-digit code with 'ref' prefix
        code := 'ref' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = code) INTO exists_check;
        
        -- If code doesn't exist, break the loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update user creation function to handle elegant referral codes
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

    INSERT INTO public.user_profiles (id, full_name, referred_by, referral_code)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        referring_user_id,
        generate_referral_code()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create 3-level referral commission processing function
CREATE OR REPLACE FUNCTION process_referral_commissions(deposit_user_id UUID, deposit_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    level1_user UUID;
    level2_user UUID;
    level3_user UUID;
    l1_percent NUMERIC;
    l2_percent NUMERIC;
    l3_percent NUMERIC;
BEGIN
    -- Get commission percentages from admin settings
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
    INTO l1_percent, l2_percent, l3_percent
    FROM admin_settings WHERE id = 1;
    
    -- Get level 1 referrer (direct referrer)
    SELECT referred_by INTO level1_user
    FROM user_profiles 
    WHERE id = deposit_user_id AND referred_by IS NOT NULL;
    
    -- Process Level 1 commission
    IF level1_user IS NOT NULL AND l1_percent > 0 THEN
        UPDATE user_profiles 
        SET balance = balance + (deposit_amount * l1_percent / 100)
        WHERE id = level1_user;
        
        -- Get level 2 referrer (referrer of level 1)
        SELECT referred_by INTO level2_user
        FROM user_profiles 
        WHERE id = level1_user AND referred_by IS NOT NULL;
        
        -- Process Level 2 commission
        IF level2_user IS NOT NULL AND l2_percent > 0 THEN
            UPDATE user_profiles 
            SET balance = balance + (deposit_amount * l2_percent / 100)
            WHERE id = level2_user;
            
            -- Get level 3 referrer (referrer of level 2)
            SELECT referred_by INTO level3_user
            FROM user_profiles 
            WHERE id = level2_user AND referred_by IS NOT NULL;
            
            -- Process Level 3 commission
            IF level3_user IS NOT NULL AND l3_percent > 0 THEN
                UPDATE user_profiles 
                SET balance = balance + (deposit_amount * l3_percent / 100)
                WHERE id = level3_user;
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Generate elegant referral codes for all existing users
UPDATE user_profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- All done! Your database now supports:
-- ✅ Elegant referral codes (ref123456 format)
-- ✅ 3-level referral commission system
-- ✅ Automatic referral code generation for new users
-- ✅ Updated existing users with referral codes
