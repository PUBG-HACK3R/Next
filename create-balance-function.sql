-- Create function to increment user balance safely
CREATE OR REPLACE FUNCTION increment_user_balance(user_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  -- Update the user's balance in user_profiles table
  UPDATE user_profiles 
  SET balance = COALESCE(balance, 0) + amount,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
