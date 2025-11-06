-- Temporarily disable withdrawal time restriction trigger for testing

-- Drop the trigger that blocks withdrawals outside business hours
DROP TRIGGER IF EXISTS withdrawal_time_check ON withdrawals;

-- Optionally, you can also drop the function if you want
-- DROP FUNCTION IF EXISTS check_withdrawal_time_trigger();
-- DROP FUNCTION IF EXISTS is_withdrawal_allowed();

-- Verify the trigger is removed
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'withdrawal_time_check';

-- This should return no rows if the trigger is successfully removed
