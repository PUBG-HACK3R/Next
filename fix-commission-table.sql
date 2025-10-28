-- Check the actual referral_commissions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referral_commissions'
ORDER BY ordinal_position;

-- Check what columns exist
SELECT * FROM referral_commissions LIMIT 1;
