-- Add missing columns to referral_commissions table

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS commission_level INTEGER;

ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
ORDER BY ordinal_position;
