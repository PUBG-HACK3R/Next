-- Add earned_balance column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN earned_balance DECIMAL(10,2) DEFAULT 0.00;

-- Create function to increment earned balance
CREATE OR REPLACE FUNCTION increment_earned_balance(user_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET earned_balance = COALESCE(earned_balance, 0) + amount,
      updated_at = NOW()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to transfer earned balance to main balance
CREATE OR REPLACE FUNCTION transfer_earned_to_main(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  earned_amount DECIMAL;
BEGIN
  -- Get current earned balance
  SELECT earned_balance INTO earned_amount 
  FROM user_profiles 
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
  
  -- Transfer earned to main balance and reset earned balance
  UPDATE user_profiles 
  SET balance = COALESCE(balance, 0) + COALESCE(earned_balance, 0),
      earned_balance = 0,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN earned_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
