-- Add admin tracking to deposits and withdrawals tables

-- Add approved_by column to deposits table
ALTER TABLE deposits 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_by column to withdrawals table  
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create a view to show admin names with approvals
CREATE OR REPLACE VIEW deposits_with_admin AS
SELECT 
  d.*,
  up.full_name as approved_by_name
FROM deposits d
LEFT JOIN user_profiles up ON d.approved_by = up.id;

CREATE OR REPLACE VIEW withdrawals_with_admin AS
SELECT 
  w.*,
  up.full_name as approved_by_name  
FROM withdrawals w
LEFT JOIN user_profiles up ON w.approved_by = up.id;

-- Grant permissions
GRANT SELECT ON deposits_with_admin TO authenticated;
GRANT SELECT ON withdrawals_with_admin TO authenticated;
