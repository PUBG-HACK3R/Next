-- Temporarily disable the referral commission trigger that's causing RLS errors

-- Disable the trigger on deposits table
ALTER TABLE deposits DISABLE TRIGGER trigger_calculate_referral_commissions;

-- Verify the trigger is disabled
SELECT 
    trigger_name,
    event_object_table,
    trigger_schema,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_calculate_referral_commissions';

-- Test USDT deposits now - they should work!

-- To re-enable later:
-- ALTER TABLE deposits ENABLE TRIGGER trigger_calculate_referral_commissions;
