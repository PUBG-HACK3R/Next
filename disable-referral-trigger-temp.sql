-- Temporarily disable referral commission trigger to allow deposits

-- Drop the trigger that's causing issues
DROP TRIGGER IF EXISTS referral_commission_trigger ON deposits;

-- Also drop any other commission triggers that might exist
DROP TRIGGER IF EXISTS calculate_referral_commissions_trigger ON deposits;
DROP TRIGGER IF EXISTS usdt_commission_trigger ON deposits;
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;

-- List all triggers on deposits table to see what's left
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits';

-- This should return no rows if all triggers are removed
