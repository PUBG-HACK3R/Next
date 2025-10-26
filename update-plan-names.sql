-- Update existing plan names to mining theme
-- Run this in Supabase SQL Editor to update plan names

UPDATE plans SET name = 'Bitcoin Starter' WHERE name = 'Basic Plan';
UPDATE plans SET name = 'Ethereum Pro' WHERE name = 'Standard Plan';
UPDATE plans SET name = 'Mining Elite' WHERE name = 'Premium Plan';
UPDATE plans SET name = 'Crypto Master' WHERE name = 'VIP Plan';

-- Verify the changes
SELECT id, name, duration_days, profit_percent, min_investment, status FROM plans ORDER BY min_investment;
