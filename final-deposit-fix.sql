-- FINAL DEPOSIT SYSTEM FIX
-- This version avoids dropping shared functions

-- Step 1: Drop existing problematic tables and policies
DROP TABLE IF EXISTS usdt_deposits CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;

-- Step 2: Create new clean deposits table with better structure
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

-- Step 3: Create indexes for better performance
DROP INDEX IF EXISTS idx_deposits_user_id;
DROP INDEX IF EXISTS idx_deposits_status;
DROP INDEX IF EXISTS idx_deposits_created_at;
DROP INDEX IF EXISTS idx_deposits_type;

CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);
CREATE INDEX idx_deposits_type ON deposits(deposit_type);

-- Step 4: Create deposit_transactions table (drop first if exists)
DROP TABLE IF EXISTS deposit_transactions CASCADE;

CREATE TABLE deposit_transactions (
    id SERIAL PRIMARY KEY,
    deposit_id INTEGER NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    transaction_type VARCHAR(20) DEFAULT 'deposit_approval' CHECK (transaction_type IN ('deposit_approval', 'commission_l1', 'commission_l2', 'commission_l3')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for deposit_transactions
CREATE INDEX idx_deposit_transactions_user_id ON deposit_transactions(user_id);
CREATE INDEX idx_deposit_transactions_deposit_id ON deposit_transactions(deposit_id);

-- Step 6: Update admin_settings safely
DO $$
BEGIN
    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'min_deposit_amount') THEN
        ALTER TABLE admin_settings ADD COLUMN min_deposit_amount NUMERIC(10,2) DEFAULT 1000;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'usdt_wallet_address') THEN
        ALTER TABLE admin_settings ADD COLUMN usdt_wallet_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'min_usdt_deposit') THEN
        ALTER TABLE admin_settings ADD COLUMN min_usdt_deposit NUMERIC(10,4) DEFAULT 10;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'usdt_to_pkr_rate') THEN
        ALTER TABLE admin_settings ADD COLUMN usdt_to_pkr_rate NUMERIC(10,2) DEFAULT 280;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'usdt_chains') THEN
        ALTER TABLE admin_settings ADD COLUMN usdt_chains JSONB DEFAULT '[{"name":"TRC20","network":"Tron","enabled":true},{"name":"BEP20","network":"BSC","enabled":true}]';
    END IF;
END $$;

-- Step 7: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_can_insert_deposits" ON deposits;
DROP POLICY IF EXISTS "users_can_view_own_deposits" ON deposits;
DROP POLICY IF EXISTS "users_can_update_own_deposits" ON deposits;
DROP POLICY IF EXISTS "admins_can_manage_all_deposits" ON deposits;
DROP POLICY IF EXISTS "users_create_own_deposits" ON deposits;
DROP POLICY IF EXISTS "users_view_own_deposits" ON deposits;
DROP POLICY IF EXISTS "admins_manage_deposits" ON deposits;

-- Step 8: Set up Row Level Security with WORKING policies
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions first
GRANT INSERT, SELECT, UPDATE ON deposits TO authenticated;
GRANT USAGE ON SEQUENCE deposits_id_seq TO authenticated;

-- Create working RLS policies
CREATE POLICY "users_can_insert_deposits" ON deposits
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_view_own_deposits" ON deposits
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_deposits" ON deposits
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "admins_can_manage_all_deposits" ON deposits
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Step 9: Set up RLS for deposit_transactions
DROP POLICY IF EXISTS "users_view_own_deposit_transactions" ON deposit_transactions;
DROP POLICY IF EXISTS "admins_manage_deposit_transactions" ON deposit_transactions;

ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON deposit_transactions TO authenticated;

CREATE POLICY "users_view_own_deposit_transactions" ON deposit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_manage_deposit_transactions" ON deposit_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Step 10: Create storage bucket for deposit proofs (safe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposit-proofs', 'deposit-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Step 11: Drop existing storage policies
DROP POLICY IF EXISTS "users_upload_deposit_proofs" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own_deposit_proofs" ON storage.objects;
DROP POLICY IF EXISTS "admins_view_all_deposit_proofs" ON storage.objects;

-- Create storage policies
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

-- Step 12: Update admin settings with default values
UPDATE admin_settings SET 
    min_deposit_amount = COALESCE(min_deposit_amount, 1000),
    usdt_wallet_address = COALESCE(usdt_wallet_address, 'TBD-WALLET-ADDRESS'),
    min_usdt_deposit = COALESCE(min_usdt_deposit, 10),
    usdt_to_pkr_rate = COALESCE(usdt_to_pkr_rate, 280),
    usdt_chains = COALESCE(usdt_chains, '[{"name":"TRC20","network":"Tron","enabled":true},{"name":"BEP20","network":"BSC","enabled":true}]'::jsonb)
WHERE id = 1;

-- Step 13: Create deposit-specific stored procedures (don't drop shared functions)
DROP FUNCTION IF EXISTS process_deposit_approval(INTEGER);
DROP FUNCTION IF EXISTS reject_deposit(INTEGER, TEXT);

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
    
    -- Update deposit status
    UPDATE deposits 
    SET status = 'approved', 
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = deposit_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Step 14: Create trigger using existing function (don't recreate the function)
DROP TRIGGER IF EXISTS update_deposits_updated_at ON deposits;

-- Use the existing update_updated_at_column function
CREATE TRIGGER update_deposits_updated_at 
    BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Final deposit system setup completed!';
    RAISE NOTICE '🚀 You can now test deposits at /test-deposit';
    RAISE NOTICE '🔧 Shared functions were preserved safely';
    RAISE NOTICE '🛡️ RLS policies are now properly configured';
END $$;
