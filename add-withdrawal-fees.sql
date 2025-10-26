-- Add withdrawal fee columns to withdrawals table
-- This migration adds fee tracking functionality for withdrawals

-- Add fee-related columns to withdrawals table
ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS fee_percent DECIMAL(5,2) DEFAULT 0;

ALTER TABLE withdrawals 
ADD COLUMN IF NOT EXISTS total_deducted DECIMAL(10,2) DEFAULT 0;

-- Update existing withdrawals to have default fee values
UPDATE withdrawals 
SET 
    fee_amount = COALESCE(fee_amount, 0),
    fee_percent = COALESCE(fee_percent, 0),
    total_deducted = COALESCE(total_deducted, amount)
WHERE fee_amount IS NULL OR fee_percent IS NULL OR total_deducted IS NULL;

-- Add comments to the new columns
COMMENT ON COLUMN withdrawals.fee_amount IS 'Fee amount deducted for the withdrawal';
COMMENT ON COLUMN withdrawals.fee_percent IS 'Fee percentage applied to the withdrawal';
COMMENT ON COLUMN withdrawals.total_deducted IS 'Total amount deducted from user balance (withdrawal amount + fee)';

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'withdrawals' 
AND column_name IN ('fee_amount', 'fee_percent', 'total_deducted');
