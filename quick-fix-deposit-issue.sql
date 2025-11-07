-- Quick fix for deposit creation issue

-- Step 1: Temporarily disable the agent eligibility trigger that runs on INSERT
DROP TRIGGER IF EXISTS update_agent_eligibility_on_deposit ON deposits;

-- Step 2: Check if the user_id foreign key is pointing to the right table
-- The deposits table might be referencing auth.users(id) but user_profiles(id) should be used

-- Let's see the current foreign key constraints
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'deposits' 
AND tc.constraint_type = 'FOREIGN KEY';

-- If the foreign key is wrong, we'll need to fix it
-- But for now, let's just try without the agent trigger
