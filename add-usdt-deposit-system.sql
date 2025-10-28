-- Add USDT deposit system to admin settings

-- Add USDT configuration columns to admin_settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS usdt_wallet_address TEXT DEFAULT 'TXYZabc123...';

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS usdt_chains JSONB DEFAULT '[
    {"name": "TRC20", "network": "Tron", "enabled": true},
    {"name": "BEP20", "network": "BSC", "enabled": true},
    {"name": "Arbitrum", "network": "Arbitrum One", "enabled": true}
]'::jsonb;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS min_usdt_deposit NUMERIC DEFAULT 10;

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS usdt_to_pkr_rate NUMERIC DEFAULT 280;

-- Update deposit_details to include USDT
UPDATE admin_settings 
SET deposit_details = deposit_details || '{
    "usdt": {
        "wallet_address": "TXYZabc123...",
        "chains": [
            {"name": "TRC20", "network": "Tron", "enabled": true},
            {"name": "BEP20", "network": "BSC", "enabled": true},
            {"name": "Arbitrum", "network": "Arbitrum One", "enabled": true}
        ],
        "min_deposit": 10,
        "rate_pkr": 280
    }
}'::jsonb
WHERE id = 1;

-- Create USDT deposits table
CREATE TABLE IF NOT EXISTS usdt_deposits (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount_usdt NUMERIC NOT NULL,
    amount_pkr NUMERIC NOT NULL,
    usdt_rate NUMERIC NOT NULL,
    wallet_address TEXT NOT NULL,
    chain_name TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    proof_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for USDT deposits
ALTER TABLE usdt_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own USDT deposits" ON usdt_deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own USDT deposits" ON usdt_deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all USDT deposits" ON usdt_deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Add comments
COMMENT ON COLUMN admin_settings.usdt_wallet_address IS 'USDT wallet address for deposits';
COMMENT ON COLUMN admin_settings.usdt_chains IS 'Available blockchain networks for USDT deposits';
COMMENT ON COLUMN admin_settings.min_usdt_deposit IS 'Minimum USDT deposit amount';
COMMENT ON COLUMN admin_settings.usdt_to_pkr_rate IS 'Current USDT to PKR exchange rate';

COMMENT ON TABLE usdt_deposits IS 'USDT cryptocurrency deposit transactions';
COMMENT ON COLUMN usdt_deposits.amount_usdt IS 'Deposit amount in USDT';
COMMENT ON COLUMN usdt_deposits.amount_pkr IS 'Equivalent amount in PKR';
COMMENT ON COLUMN usdt_deposits.usdt_rate IS 'Exchange rate used at time of deposit';
COMMENT ON COLUMN usdt_deposits.wallet_address IS 'Wallet address used for deposit';
COMMENT ON COLUMN usdt_deposits.chain_name IS 'Blockchain network used (TRC20, BEP20, Arbitrum)';
COMMENT ON COLUMN usdt_deposits.transaction_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN usdt_deposits.proof_url IS 'Screenshot proof of transaction';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usdt_deposits_user_id ON usdt_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_usdt_deposits_status ON usdt_deposits(status);
CREATE INDEX IF NOT EXISTS idx_usdt_deposits_created_at ON usdt_deposits(created_at);

-- Verify the setup
SELECT 
    usdt_wallet_address,
    usdt_chains,
    min_usdt_deposit,
    usdt_to_pkr_rate
FROM admin_settings WHERE id = 1;
