-- Fix the referral_commissions constraint issue
-- Check existing data and clean up before adding constraint

-- First, check what data exists in referral_commissions
SELECT 
    id,
    deposit_id,
    CASE 
        WHEN deposit_id IS NULL THEN 'NULL'
        ELSE deposit_id::text
    END as deposit_id_status,
    referrer_id,
    referred_user_id,
    commission_amount
FROM referral_commissions
ORDER BY id;

-- Check for rows that would violate the constraint
SELECT 
    COUNT(*) as problematic_rows,
    COUNT(CASE WHEN deposit_id IS NULL THEN 1 END) as null_deposit_id,
    COUNT(CASE WHEN deposit_id IS NOT NULL THEN 1 END) as has_deposit_id
FROM referral_commissions;

-- If there are rows with NULL deposit_id, we need to either:
-- 1. Delete them (if they're invalid)
-- 2. Or fix them by linking to actual deposits

-- For now, let's see what we have
SELECT * FROM referral_commissions WHERE deposit_id IS NULL;
