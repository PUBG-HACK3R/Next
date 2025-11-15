-- ============================================================================
-- ADD USER SUSPENSION COLUMNS TO user_profiles TABLE
-- ============================================================================

-- Add suspension-related columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create index on suspended column for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_suspended 
ON user_profiles(suspended);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
AND column_name IN ('suspended', 'suspended_at', 'suspension_reason')
ORDER BY ordinal_position;

-- Display success message
SELECT 'User suspension columns added successfully!' AS status;
