-- Temporarily disable the trigger to test signup without it

-- Drop the trigger (we can recreate it later)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function but don't use it automatically
-- This allows us to test signup without the trigger interfering
