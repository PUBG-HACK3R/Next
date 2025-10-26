-- SmartGrow Mining Database Schema

-- Enable Row Level Security (JWT secret is automatically managed by Supabase)

-- Create user_profiles table (extends auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    balance NUMERIC DEFAULT 0,
    referred_by UUID REFERENCES user_profiles(id),
    referral_code TEXT UNIQUE,
    user_level INTEGER DEFAULT 1,
    withdrawal_account_type TEXT,
    withdrawal_account_name TEXT,
    withdrawal_account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    profit_percent NUMERIC NOT NULL,
    min_investment NUMERIC NOT NULL,
    capital_return BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investments table
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    amount_invested NUMERIC NOT NULL,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deposits table
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    sender_name TEXT NOT NULL,
    sender_last_4_digits TEXT NOT NULL,
    proof_url TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_settings table
CREATE TABLE admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    referral_l1_percent NUMERIC DEFAULT 5,
    referral_l2_percent NUMERIC DEFAULT 3,
    referral_l3_percent NUMERIC DEFAULT 2,
    deposit_details JSONB DEFAULT '{"bank": {"name": "HBL Bank", "account": "1234567890", "title": "SmartGrow Mining"}, "easypaisa": {"number": "03001234567", "title": "SmartGrow Mining"}}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default admin settings
INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert sample mining investment plans
INSERT INTO plans (name, duration_days, profit_percent, min_investment, status) VALUES
('Bitcoin Starter', 15, 6, 10000, 'Active'),
('Ethereum Pro', 30, 12, 25000, 'Active'),
('Mining Elite', 45, 20, 50000, 'Premium'),
('Crypto Master', 60, 30, 100000, 'Premium');

-- Create storage bucket for deposit proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('deposit_proofs', 'deposit_proofs', false);

-- Row Level Security Policies

-- User profiles policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Plans policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON plans
    FOR SELECT USING (status = 'Active' OR status = 'Premium');

CREATE POLICY "Admins can manage plans" ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Investments policies
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments" ON investments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Deposits policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage deposits" ON deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Withdrawals policies
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage withdrawals" ON withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Admin settings policies
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view admin settings" ON admin_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON admin_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Storage policies for deposit proofs
CREATE POLICY "Users can upload deposit proofs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'deposit_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own deposit proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'deposit_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all deposit proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deposit_proofs' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Functions and triggers

-- Function to generate elegant referral codes
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

-- Function to automatically create user profile on signup with referral support
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

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment user balance (for deposit approvals)
CREATE OR REPLACE FUNCTION increment_user_balance(user_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET balance = balance + amount 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for user_id: %', user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement user balance (for withdrawal requests)
CREATE OR REPLACE FUNCTION decrement_user_balance(user_id UUID, amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    SELECT balance INTO current_balance 
    FROM user_profiles 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for user_id: %', user_id;
    END IF;
    
    IF current_balance < amount THEN
        RETURN FALSE; -- Insufficient balance
    END IF;
    
    UPDATE user_profiles 
    SET balance = balance - amount 
    WHERE id = user_id;
    
    RETURN TRUE; -- Success
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process 3-level referral commissions when deposit is approved
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

-- Update existing users to have referral codes (run this once after adding the referral_code column)
UPDATE user_profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;
