-- Debug and fix the deposit INSERT issue

-- First, let's check what the agent eligibility trigger does
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'trigger_update_agent_eligibility';

-- Temporarily disable the agent eligibility trigger on INSERT to test
DROP TRIGGER IF EXISTS update_agent_eligibility_on_deposit ON deposits;

-- Check if there are any constraints that might be failing
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'deposits';

-- Check the deposits table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'deposits' 
ORDER BY ordinal_position;
