-- Fix deposit approval issue by adding deposit_id column to referral_commissions
-- This resolves: "column 'deposit_id' does not exist" error

-- Step 1: Add deposit_id column if it doesn't exist
ALTER TABLE referral_commissions 
ADD COLUMN IF NOT EXISTS deposit_id INTEGER REFERENCES deposits(id) ON DELETE CASCADE;

-- Step 2: Create index for deposit_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_referral_commissions_deposit ON referral_commissions(deposit_id);

-- Step 3: Update the process_deposit_commissions function to accept deposit_id
DROP FUNCTION IF EXISTS process_deposit_commissions(UUID, DECIMAL);
DROP FUNCTION IF EXISTS process_deposit_commissions(UUID, DECIMAL, INTEGER);

CREATE OR REPLACE FUNCTION process_deposit_commissions(user_id_param UUID, deposit_amount_param DECIMAL, deposit_id_param INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  current_referrer_id UUID;
  commission_level INTEGER := 1;
  commission_rate DECIMAL;
  commission_amount DECIMAL;
  total_commissions DECIMAL := 0;
  commissions_created INTEGER := 0;
BEGIN
  -- Start with the user's direct referrer
  SELECT referred_by INTO current_referrer_id
  FROM user_profiles 
  WHERE id = user_id_param;
  
  -- Process up to 3 levels of referrers
  WHILE current_referrer_id IS NOT NULL AND commission_level <= 3 LOOP
    -- Get commission rate for this level
    SELECT deposit_commission_percent INTO commission_rate
    FROM referral_settings
    WHERE level = commission_level;
    
    IF commission_rate IS NOT NULL AND commission_rate > 0 THEN
      -- Calculate commission amount
      commission_amount := (deposit_amount_param * commission_rate / 100);
      
      -- Create commission record
      INSERT INTO referral_commissions (
        referrer_id,
        referred_user_id,
        commission_type,
        level,
        amount,
        source_amount,
        commission_rate,
        deposit_id,
        status,
        created_at
      ) VALUES (
        current_referrer_id,
        user_id_param,
        'deposit',
        commission_level,
        commission_amount,
        deposit_amount_param,
        commission_rate,
        deposit_id_param,
        'completed',
        NOW()
      );
      
      -- Add commission to referrer's balance
      UPDATE user_profiles 
      SET balance = COALESCE(balance, 0) + commission_amount,
          updated_at = NOW()
      WHERE id = current_referrer_id;
      
      total_commissions := total_commissions + commission_amount;
      commissions_created := commissions_created + 1;
    END IF;
    
    -- Move to next level referrer
    SELECT referred_by INTO current_referrer_id
    FROM user_profiles 
    WHERE id = current_referrer_id;
    
    commission_level := commission_level + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'commissions_created', commissions_created,
    'total_amount', total_commissions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update the trigger to pass deposit_id
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;

CREATE OR REPLACE FUNCTION trigger_deposit_commissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when deposit is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Process deposit commissions
    PERFORM process_deposit_commissions(NEW.user_id, NEW.amount_pkr, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deposit_commission_trigger
  AFTER INSERT OR UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_deposit_commissions();

SELECT 'Deposit approval fix applied successfully!' as status;
