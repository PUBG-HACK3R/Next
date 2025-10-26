-- Sample Mining Investment Plans for SmartGrow Mining (Fixed Version)
-- Run this in Supabase SQL Editor to add investment plans

-- Insert sample investment plans
INSERT INTO plans (name, duration_days, profit_percent, min_investment, capital_return, status) VALUES
('Starter Farm Plan', 30, 15, 5000, true, 'Active'),
('Growth Agriculture', 60, 25, 10000, true, 'Active'),
('Premium Harvest', 90, 35, 25000, true, 'Premium'),
('Elite Agro Investment', 120, 45, 50000, true, 'Premium'),
('Quick Crop', 15, 8, 2000, true, 'Active'),
('Seasonal Farming', 180, 60, 100000, false, 'Premium');

-- Insert basic admin settings for referral commissions
INSERT INTO admin_settings (
    id,
    referral_l1_percent,
    referral_l2_percent,
    referral_l3_percent
) VALUES (
    1,
    5.0,  -- Level 1: 5% commission
    3.0,  -- Level 2: 3% commission
    2.0   -- Level 3: 2% commission
) ON CONFLICT (id) DO UPDATE SET
    referral_l1_percent = EXCLUDED.referral_l1_percent,
    referral_l2_percent = EXCLUDED.referral_l2_percent,
    referral_l3_percent = EXCLUDED.referral_l3_percent;
