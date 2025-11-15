-- Temporarily disable all referral commissions
-- This will stop all new commission calculations

-- Drop the deposit commission trigger
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits CASCADE;

-- Set all commission rates to 0 in admin settings
UPDATE admin_settings 
SET 
    referral_l1_percent = 0,
    referral_l1_deposit_percent = 0,
    referral_l2_percent = 0,
    referral_l3_percent = 0
WHERE id = 1;

-- Verify the changes
SELECT 
    'Commissions temporarily disabled' as status,
    referral_l1_percent as l1_earnings_percent,
    referral_l1_deposit_percent as l1_deposit_percent,
    referral_l2_percent as l2_earnings_percent,
    referral_l3_percent as l3_earnings_percent
FROM admin_settings 
WHERE id = 1;

-- Note: To re-enable, we'll need to run a separate script with the correct percentages
