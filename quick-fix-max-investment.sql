-- Quick fix: Add missing max_investment_amount column

ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS max_investment_amount NUMERIC DEFAULT 50000;

-- Update existing record
UPDATE admin_settings 
SET max_investment_amount = 50000 
WHERE id = 1 AND max_investment_amount IS NULL;

-- Verify the column exists
SELECT max_investment_amount FROM admin_settings WHERE id = 1;
