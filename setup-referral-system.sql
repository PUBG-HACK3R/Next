-- Complete Referral Commission System Setup
-- This creates all necessary functions and triggers for referral commissions

-- Step 1: Create referral commission settings table (if not exists)
CREATE TABLE IF NOT EXISTS referral_settings (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL UNIQUE,
  deposit_commission_percent DECIMAL(5,2) DEFAULT 0,
  earning_commission_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default commission rates (delete existing first)
DELETE FROM referral_settings WHERE level IN (1, 2, 3);

INSERT INTO referral_settings (level, deposit_commission_percent, earning_commission_percent) 
VALUES 
  (1, 5.00, 10.00),  -- L1: 5% deposit, 10% earning
  (2, 3.00, 5.00),   -- L2: 3% deposit, 5% earning  
  (3, 2.00, 3.00);   -- L3: 2% deposit, 3% earning

-- Create referral_commissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_commissions (
  id SERIAL PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES user_profiles(id),
  referred_user_id UUID NOT NULL REFERENCES user_profiles(id),
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('deposit', 'earning')),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  amount DECIMAL(10,2) NOT NULL,
  source_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  deposit_id INTEGER REFERENCES deposits(id),
  investment_id INTEGER REFERENCES investments(id),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred ON referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_type ON referral_commissions(commission_type);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS process_deposit_commissions(UUID, DECIMAL);
DROP FUNCTION IF EXISTS process_deposit_commissions(UUID, DECIMAL, INTEGER);
DROP FUNCTION IF EXISTS process_earning_commissions(UUID, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS process_earning_commissions(UUID, INTEGER, NUMERIC);

-- Step 2: Create deposit commission function
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

-- Step 3: Create earning commission function
CREATE OR REPLACE FUNCTION process_earning_commissions(user_id_param UUID, investment_id_param INTEGER, earning_amount_param DECIMAL)
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
    SELECT earning_commission_percent INTO commission_rate
    FROM referral_settings
    WHERE level = commission_level;
    
    IF commission_rate IS NOT NULL AND commission_rate > 0 THEN
      -- Calculate commission amount
      commission_amount := (earning_amount_param * commission_rate / 100);
      
      -- Create commission record
      INSERT INTO referral_commissions (
        referrer_id,
        referred_user_id,
        commission_type,
        level,
        amount,
        source_amount,
        commission_rate,
        investment_id,
        status,
        created_at
      ) VALUES (
        current_referrer_id,
        user_id_param,
        'earning',
        commission_level,
        commission_amount,
        earning_amount_param,
        commission_rate,
        investment_id_param,
        'completed',
        NOW()
      );
      
      -- Add commission to referrer's earned balance (locked until their investment completes)
      UPDATE user_profiles 
      SET earned_balance = COALESCE(earned_balance, 0) + commission_amount,
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

-- Step 4: Create trigger for automatic deposit commissions
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;

-- Create the trigger
CREATE TRIGGER deposit_commission_trigger
  AFTER INSERT OR UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_deposit_commissions();

-- Step 5: Add comments for documentation
COMMENT ON FUNCTION process_deposit_commissions(UUID, DECIMAL) IS 'Processes referral commissions for deposits across 3 levels';
COMMENT ON FUNCTION process_earning_commissions(UUID, INTEGER, DECIMAL) IS 'Processes referral commissions for earnings across 3 levels';
COMMENT ON FUNCTION trigger_deposit_commissions() IS 'Trigger function to automatically process deposit commissions';

-- Step 6: Show current settings
SELECT 'Referral Commission Settings' as info;
SELECT 
  level,
  deposit_commission_percent || '%' as deposit_commission,
  earning_commission_percent || '%' as earning_commission
FROM referral_settings 
ORDER BY level;

SELECT 'Referral system setup complete!' as status;
SELECT 'Commission rates: L1=5%/10%, L2=3%/5%, L3=2%/3% (deposit/earning)' as rates;
SELECT 'Triggers: Automatic deposit commissions enabled' as triggers;
