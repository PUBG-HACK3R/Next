-- Fix referral_commissions table structure
-- This will update the existing table to match our requirements

-- First, let's see what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referral_commissions'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add commission_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_commissions' AND column_name = 'commission_type'
  ) THEN
    ALTER TABLE referral_commissions ADD COLUMN commission_type VARCHAR(20) DEFAULT 'deposit';
    ALTER TABLE referral_commissions ADD CONSTRAINT check_commission_type 
      CHECK (commission_type IN ('deposit', 'earning'));
  END IF;

  -- Add level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_commissions' AND column_name = 'level'
  ) THEN
    ALTER TABLE referral_commissions ADD COLUMN level INTEGER DEFAULT 1;
    ALTER TABLE referral_commissions ADD CONSTRAINT check_level 
      CHECK (level >= 1 AND level <= 3);
  END IF;

  -- Add source_amount column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_commissions' AND column_name = 'source_amount'
  ) THEN
    ALTER TABLE referral_commissions ADD COLUMN source_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Add commission_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_commissions' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE referral_commissions ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0;
  END IF;

  -- Add investment_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_commissions' AND column_name = 'investment_id'
  ) THEN
    ALTER TABLE referral_commissions ADD COLUMN investment_id INTEGER;
    -- Add foreign key constraint if investments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investments') THEN
      ALTER TABLE referral_commissions ADD CONSTRAINT fk_investment 
        FOREIGN KEY (investment_id) REFERENCES investments(id);
    END IF;
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_commissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE referral_commissions ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
    ALTER TABLE referral_commissions ADD CONSTRAINT check_status 
      CHECK (status IN ('pending', 'completed', 'cancelled'));
  END IF;

END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred ON referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_type ON referral_commissions(commission_type);

-- Show final table structure
SELECT 'Updated referral_commissions table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'referral_commissions'
ORDER BY ordinal_position;

SELECT 'Table structure updated successfully!' as status;
