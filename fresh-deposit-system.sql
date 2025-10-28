-- Fresh Deposit System Database Schema
-- This will replace the existing broken deposit system

-- Drop existing problematic tables and policies
DROP TABLE IF EXISTS usdt_deposits CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;

-- Create new clean deposits table with better structure
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Deposit details
    deposit_type VARCHAR(20) NOT NULL CHECK (deposit_type IN ('bank', 'easypaisa', 'usdt')),
    amount_pkr NUMERIC(15,2) NOT NULL CHECK (amount_pkr > 0),
    
    -- Traditional deposit fields (bank/easypaisa)
    sender_name VARCHAR(255),
    sender_account_last4 VARCHAR(4),
    
    -- USDT specific fields
    amount_usdt NUMERIC(15,8),
    usdt_rate NUMERIC(10,2),
    chain_name VARCHAR(50),
    transaction_hash VARCHAR(255),
    wallet_address VARCHAR(255),
    
    -- Common fields
    proof_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);
CREATE INDEX idx_deposits_type ON deposits(deposit_type);

-- Create deposit_transactions table for tracking balance updates
CREATE TABLE deposit_transactions (
    id SERIAL PRIMARY KEY,
    deposit_id INTEGER NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    transaction_type VARCHAR(20) DEFAULT 'deposit_approval' CHECK (transaction_type IN ('deposit_approval', 'commission_l1', 'commission_l2', 'commission_l3')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deposit_transactions
CREATE INDEX idx_deposit_transactions_user_id ON deposit_transactions(user_id);
CREATE INDEX idx_deposit_transactions_deposit_id ON deposit_transactions(deposit_id);

-- Update admin_settings to include new deposit configuration
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS min_deposit_amount NUMERIC(10,2) DEFAULT 1000;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS usdt_wallet_address TEXT;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS min_usdt_deposit NUMERIC(10,4) DEFAULT 10;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS usdt_to_pkr_rate NUMERIC(10,2) DEFAULT 280;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS usdt_chains JSONB DEFAULT '[{"name":"TRC20","network":"Tron","enabled":true},{"name":"BEP20","network":"BSC","enabled":true}]';

-- Row Level Security Policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "users_view_own_deposits" ON deposits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own deposits
CREATE POLICY "users_create_own_deposits" ON deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all deposits
CREATE POLICY "admins_manage_all_deposits" ON deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Deposit transactions policies
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_deposit_transactions" ON deposit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_manage_deposit_transactions" ON deposit_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Function to process deposit approval with commissions
CREATE OR REPLACE FUNCTION process_deposit_approval(deposit_id INTEGER)
RETURNS VOID AS $$
DECLARE
    deposit_record deposits%ROWTYPE;
    user_profile user_profiles%ROWTYPE;
    l1_user UUID;
    l2_user UUID;
    l3_user UUID;
    l1_percent NUMERIC;
    l2_percent NUMERIC;
    l3_percent NUMERIC;
    commission_amount NUMERIC;
BEGIN
    -- Get deposit details
    SELECT * INTO deposit_record FROM deposits WHERE id = deposit_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit not found';
    END IF;
    
    IF deposit_record.status != 'pending' THEN
        RAISE EXCEPTION 'Deposit is not in pending status';
    END IF;
    
    -- Get user profile
    SELECT * INTO user_profile FROM user_profiles WHERE id = deposit_record.user_id;
    
    -- Update user balance
    UPDATE user_profiles 
    SET balance = balance + deposit_record.amount_pkr 
    WHERE id = deposit_record.user_id;
    
    -- Record the main deposit transaction
    INSERT INTO deposit_transactions (deposit_id, user_id, amount, transaction_type, description)
    VALUES (deposit_id, deposit_record.user_id, deposit_record.amount_pkr, 'deposit_approval', 
            'Deposit approved and balance credited');
    
    -- Get commission rates
    SELECT referral_l1_percent, referral_l2_percent, referral_l3_percent
    INTO l1_percent, l2_percent, l3_percent
    FROM admin_settings WHERE id = 1;
    
    -- Process referral commissions if user was referred
    IF user_profile.referred_by IS NOT NULL THEN
        -- Level 1 commission
        l1_user := user_profile.referred_by;
        IF l1_percent > 0 THEN
            commission_amount := deposit_record.amount_pkr * l1_percent / 100;
            
            UPDATE user_profiles 
            SET balance = balance + commission_amount 
            WHERE id = l1_user;
            
            INSERT INTO deposit_transactions (deposit_id, user_id, amount, transaction_type, description)
            VALUES (deposit_id, l1_user, commission_amount, 'commission_l1', 
                    'Level 1 referral commission from deposit #' || deposit_id);
            
            -- Get Level 2 referrer
            SELECT referred_by INTO l2_user FROM user_profiles WHERE id = l1_user;
            
            IF l2_user IS NOT NULL AND l2_percent > 0 THEN
                commission_amount := deposit_record.amount_pkr * l2_percent / 100;
                
                UPDATE user_profiles 
                SET balance = balance + commission_amount 
                WHERE id = l2_user;
                
                INSERT INTO deposit_transactions (deposit_id, user_id, amount, transaction_type, description)
                VALUES (deposit_id, l2_user, commission_amount, 'commission_l2', 
                        'Level 2 referral commission from deposit #' || deposit_id);
                
                -- Get Level 3 referrer
                SELECT referred_by INTO l3_user FROM user_profiles WHERE id = l2_user;
                
                IF l3_user IS NOT NULL AND l3_percent > 0 THEN
                    commission_amount := deposit_record.amount_pkr * l3_percent / 100;
                    
                    UPDATE user_profiles 
                    SET balance = balance + commission_amount 
                    WHERE id = l3_user;
                    
                    INSERT INTO deposit_transactions (deposit_id, user_id, amount, transaction_type, description)
                    VALUES (deposit_id, l3_user, commission_amount, 'commission_l3', 
                            'Level 3 referral commission from deposit #' || deposit_id);
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Update deposit status
    UPDATE deposits 
    SET status = 'approved', 
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = deposit_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject deposit
CREATE OR REPLACE FUNCTION reject_deposit(deposit_id INTEGER, reason TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE deposits 
    SET status = 'rejected', 
        rejection_reason = reason,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = deposit_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_deposits_updated_at 
    BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for deposit proofs (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposit-proofs', 'deposit-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for deposit proofs
CREATE POLICY "users_upload_deposit_proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'deposit-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "users_view_own_deposit_proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deposit-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "admins_view_all_deposit_proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deposit-proofs' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Update admin settings with default values
UPDATE admin_settings SET 
    min_deposit_amount = COALESCE(min_deposit_amount, 1000),
    usdt_wallet_address = COALESCE(usdt_wallet_address, 'TBD-WALLET-ADDRESS'),
    min_usdt_deposit = COALESCE(min_usdt_deposit, 10),
    usdt_to_pkr_rate = COALESCE(usdt_to_pkr_rate, 280),
    usdt_chains = COALESCE(usdt_chains, '[{"name":"TRC20","network":"Tron","enabled":true},{"name":"BEP20","network":"BSC","enabled":true}]'::jsonb)
WHERE id = 1;
