-- Add L1 deposit commission field to admin settings
-- This allows separate configuration for L1 deposit commissions vs earnings commissions

-- Add the new column for L1 deposit commission percentage
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS referral_l1_deposit_percent NUMERIC DEFAULT 5;

-- Update the existing row to set a default value
UPDATE admin_settings 
SET referral_l1_deposit_percent = 5 
WHERE id = 1 AND referral_l1_deposit_percent IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN admin_settings.referral_l1_deposit_percent IS 'Commission percentage for L1 referrals on deposits';

-- Verify the change
SELECT 
    referral_l1_percent as l1_earnings_percent,
    referral_l1_deposit_percent as l1_deposit_percent,
    referral_l2_percent as l2_earnings_percent,
    referral_l3_percent as l3_earnings_percent
FROM admin_settings 
WHERE id = 1;

SELECT 'L1 deposit commission field added successfully' AS status;
