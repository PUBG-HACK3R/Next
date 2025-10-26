-- Add maximum investment amount to plans table
-- This allows each plan to have its own maximum investment limit

-- Add max_investment column to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS max_investment DECIMAL(10,2) DEFAULT 50000;

-- Update existing plans to have default max investment amount
UPDATE plans 
SET max_investment = COALESCE(max_investment, 50000)
WHERE max_investment IS NULL;

-- Add comment to the new column
COMMENT ON COLUMN plans.max_investment IS 'Maximum investment amount allowed for this plan';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'plans' 
AND column_name = 'max_investment';
