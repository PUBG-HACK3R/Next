-- Add maximum investment amount to admin settings
-- This allows admins to control the maximum investment amount per transaction

-- Add max_investment_amount column to admin_settings table
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS max_investment_amount DECIMAL(10,2) DEFAULT 5000;

-- Update existing record to have default max investment amount
UPDATE admin_settings 
SET max_investment_amount = COALESCE(max_investment_amount, 5000)
WHERE max_investment_amount IS NULL;

-- Add comment to the new column
COMMENT ON COLUMN admin_settings.max_investment_amount IS 'Maximum investment amount allowed per transaction';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND column_name = 'max_investment_amount';
