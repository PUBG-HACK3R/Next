-- Fix deposit proof requirement and USDT RLS policy issues

-- 1. First, handle existing NULL proof_url values
-- Update existing records with NULL proof_url to have a placeholder value
UPDATE deposits 
SET proof_url = 'legacy_deposit_no_proof_' || id::text
WHERE proof_url IS NULL;

UPDATE usdt_deposits 
SET proof_url = 'legacy_usdt_deposit_no_proof_' || id::text
WHERE proof_url IS NULL;

-- 2. Now make proof_url required for both deposits and usdt_deposits tables
ALTER TABLE deposits 
ALTER COLUMN proof_url SET NOT NULL;

ALTER TABLE usdt_deposits 
ALTER COLUMN proof_url SET NOT NULL;

-- 3. Fix USDT deposits RLS policies - the issue might be with the policy conditions
-- Drop existing policies and recreate them with proper conditions
DROP POLICY IF EXISTS "Users can view own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Users can insert own USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can view all USDT deposits" ON usdt_deposits;
DROP POLICY IF EXISTS "Admins can manage all USDT deposits" ON usdt_deposits;

-- Recreate USDT deposit policies with better conditions
CREATE POLICY "Users can view own USDT deposits" ON usdt_deposits
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

CREATE POLICY "Users can insert own USDT deposits" ON usdt_deposits
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

CREATE POLICY "Admins can manage all USDT deposits" ON usdt_deposits
    FOR ALL USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- 4. Also update regular deposits policy to ensure proof is required
DROP POLICY IF EXISTS "Users can create deposits" ON deposits;

CREATE POLICY "Users can create deposits" ON deposits
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = user_id
    );

-- 5. Add constraints to ensure proof_url is not empty string
-- Drop existing constraints if they exist
ALTER TABLE deposits 
DROP CONSTRAINT IF EXISTS deposits_proof_url_not_empty;

ALTER TABLE usdt_deposits 
DROP CONSTRAINT IF EXISTS usdt_deposits_proof_url_not_empty;

-- Add the constraints
ALTER TABLE deposits 
ADD CONSTRAINT deposits_proof_url_not_empty 
CHECK (proof_url IS NOT NULL AND length(trim(proof_url)) > 0);

ALTER TABLE usdt_deposits 
ADD CONSTRAINT usdt_deposits_proof_url_not_empty 
CHECK (proof_url IS NOT NULL AND length(trim(proof_url)) > 0);

-- 6. Update existing records that might have null proof_url (if any)
-- This will fail if there are existing records without proof, which is expected
-- In that case, those records need to be handled manually

-- Verify the changes
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('deposits', 'usdt_deposits') 
AND column_name = 'proof_url';
