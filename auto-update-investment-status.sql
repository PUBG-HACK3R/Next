-- Auto-update investment status for completed plans
-- This function will automatically mark investments as 'completed' when their end_date has passed

CREATE OR REPLACE FUNCTION auto_update_investment_status()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update investments that have passed their end_date but are still marked as 'active'
  UPDATE investments 
  SET status = 'completed',
      updated_at = NOW()
  WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND end_date <= NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the update
  RAISE NOTICE 'Auto-updated % investments to completed status', updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION auto_update_investment_status() IS 'Automatically updates investment status to completed when end_date has passed';

-- Run the update immediately to fix any existing expired investments
SELECT auto_update_investment_status() AS updated_investments_count;

-- Verify the function was created
SELECT 'auto_update_investment_status function created successfully' AS status;
