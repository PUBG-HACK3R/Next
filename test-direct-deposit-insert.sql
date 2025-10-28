-- Test direct deposit insert in SQL to see if the error is from database or frontend
-- This will tell us if the issue is RLS or something else

-- Test 1: Simple INSERT into deposits table
INSERT INTO deposits (
    user_id,
    amount,
    sender_name,
    sender_last_4_digits,
    status
) VALUES (
    '3c10d87d-8f5e-4e0e-b1d4-3c7b555efe17',  -- Your user ID
    1000,
    'Test User',
    '1234',
    'pending'
);

-- If the above works, the issue is in the frontend
-- If the above fails, the issue is in the database

-- Test 2: Check what user is currently authenticated
SELECT 
    current_user as db_user,
    session_user as session_user;

-- Test 3: Check if we can access user_profiles
SELECT id, full_name FROM user_profiles LIMIT 1;

-- Test 4: Check current database name
SELECT current_database();

-- Test 5: Check if there are any active policies
SELECT COUNT(*) as policy_count FROM pg_policies;
