-- Add new columns for deposit and withdrawal settings

-- Add minimum deposit amount column (default 500 PKR)
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS min_deposit_amount NUMERIC DEFAULT 500;

-- Add minimum withdrawal amount column (default 100 PKR) 
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS min_withdrawal_amount NUMERIC DEFAULT 100;

-- Add withdrawal fee percentage column (default 3%)
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawal_fee_percent NUMERIC DEFAULT 3;

-- Update existing record with default values if they don't exist
UPDATE admin_settings 
SET 
    min_deposit_amount = COALESCE(min_deposit_amount, 500),
    min_withdrawal_amount = COALESCE(min_withdrawal_amount, 100),
    withdrawal_fee_percent = COALESCE(withdrawal_fee_percent, 3)
WHERE id = 1;
