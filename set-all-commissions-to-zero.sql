-- Set all commission types to 0%
UPDATE admin_settings 
SET 
  referral_l1_percent = 0,
  referral_l1_deposit_percent = 0,
  referral_l2_percent = 0,
  referral_l3_percent = 0
WHERE id = 1;

-- Verify the update
SELECT 
  referral_l1_percent,
  referral_l1_deposit_percent,
  referral_l2_percent,
  referral_l3_percent
FROM admin_settings 
WHERE id = 1;
