-- Revert the proof_url NOT NULL constraint that's causing the issues
-- Keep proof validation in frontend but make database more flexible

-- Make proof_url nullable again for both tables
ALTER TABLE deposits 
ALTER COLUMN proof_url DROP NOT NULL;

ALTER TABLE usdt_deposits 
ALTER COLUMN proof_url DROP NOT NULL;

-- Remove the CHECK constraints we added earlier
ALTER TABLE deposits 
DROP CONSTRAINT IF EXISTS deposits_proof_url_not_empty;

ALTER TABLE usdt_deposits 
DROP CONSTRAINT IF EXISTS usdt_deposits_proof_url_not_empty;

-- Verify the changes
SELECT 
    table_name,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('deposits', 'usdt_deposits') 
AND column_name = 'proof_url'
ORDER BY table_name;

-- Should show is_nullable = 'YES' for both tables
