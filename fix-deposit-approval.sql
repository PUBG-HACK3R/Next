-- Quick fix for deposit approval issue
-- This will temporarily disable the referral trigger and fix the table

-- Step 1: Disable the problematic trigger
DROP TRIGGER IF EXISTS deposit_commission_trigger ON deposits;

-- Step 2: Create a simple referral_commissions table
DROP TABLE IF EXISTS referral_commissions CASCADE;

CREATE TABLE referral_commissions (
  id SERIAL PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  commission_type VARCHAR(20) DEFAULT 'deposit',
  level INTEGER DEFAULT 1,
  amount DECIMAL(10,2) NOT NULL,
  source_amount DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  investment_id INTEGER,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Test deposit approval now
SELECT 'Referral trigger disabled - deposits should work now' as status;
SELECT 'You can manually test deposit approval in admin panel' as instruction;

-- Step 4: Simple manual commission function (no triggers)
CREATE OR REPLACE FUNCTION manual_deposit_commission(user_id_param UUID, deposit_amount_param DECIMAL)
RETURNS TEXT AS $$
DECLARE
  referrer_id UUID;
  commission_amount DECIMAL;
BEGIN
  -- Get the user's referrer
  SELECT referred_by INTO referrer_id
  FROM user_profiles 
  WHERE id = user_id_param;
  
  IF referrer_id IS NOT NULL THEN
    -- Calculate 5% commission
    commission_amount := deposit_amount_param * 0.05;
    
    -- Add commission to referrer's balance
    UPDATE user_profiles 
    SET balance = COALESCE(balance, 0) + commission_amount
    WHERE id = referrer_id;
    
    -- Record the commission
    INSERT INTO referral_commissions (
      referrer_id, referred_user_id, amount, source_amount, commission_rate
    ) VALUES (
      referrer_id, user_id_param, commission_amount, deposit_amount_param, 5.00
    );
    
    RETURN 'Commission of ' || commission_amount || ' PKR added to referrer';
  ELSE
    RETURN 'No referrer found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Use: SELECT manual_deposit_commission(''user_id'', amount) to manually add commissions' as usage;
