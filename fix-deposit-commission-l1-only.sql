-- Fix deposit commission to be 5% for L1 only
-- Remove deposit commissions for L2 and L3

-- Drop existing trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits CASCADE;
DROP FUNCTION IF EXISTS process_deposit_commission_trigger() CASCADE;

-- Create new function with fixed commission logic
CREATE OR REPLACE FUNCTION process_deposit_commission_trigger()
RETURNS TRIGGER AS $$
DECLARE
  referrer_id UUID;
  l1_commission DECIMAL;
  l1_deposit_percent DECIMAL := 5; -- Fixed 5% for L1 deposits
BEGIN
  -- Only process when deposit status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the depositor's direct referrer (L1 only)
    SELECT referred_by INTO referrer_id
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- If user has a direct referrer, process L1 commission only
    IF referrer_id IS NOT NULL THEN
      -- Calculate L1 commission (5% of deposit amount)
      l1_commission := (NEW.amount_pkr * l1_deposit_percent) / 100;
      
      -- Insert commission record for L1 only
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
        referrer_id,
        NEW.user_id,
        'deposit',
        1,  -- Level 1 only
        l1_commission,
        NEW.amount_pkr,
        l1_deposit_percent,
        NEW.id,
        'completed',
        NOW()
      );
      
      -- Update referrer's balance
      UPDATE user_profiles
      SET balance = COALESCE(balance, 0) + l1_commission,
          updated_at = NOW()
      WHERE id = referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER deposit_commission_trigger
  AFTER UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION process_deposit_commission_trigger();

-- Update admin settings to ensure L1 deposit commission is set to 5%
UPDATE admin_settings 
SET referral_l1_deposit_percent = 5
WHERE id = 1;

-- Verify the update
SELECT 'Deposit commission fixed! Now only L1 gets ' || COALESCE(referral_l1_deposit_percent, 5) || '% commission on deposits.'
FROM admin_settings 
WHERE id = 1;

-- Note: L2 and L3 will continue to receive earnings commissions from daily income as before
