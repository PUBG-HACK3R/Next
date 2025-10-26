-- Sample Mining Investment Plans for SmartGrow Mining
-- Run this in Supabase SQL Editor to add investment plans

-- Insert sample mining investment plans
INSERT INTO plans (name, duration_days, profit_percent, min_investment, capital_return, status) VALUES
('Bitcoin Starter', 15, 6, 10000, true, 'Active'),
('Ethereum Pro', 30, 12, 25000, true, 'Active'),
('Mining Elite', 45, 20, 50000, true, 'Premium'),
('Crypto Master', 60, 30, 100000, true, 'Premium'),
('Altcoin Miner', 90, 35, 75000, true, 'Premium'),
('Hash Power Pro', 120, 45, 150000, false, 'Premium');

-- Insert admin settings for referral commissions
INSERT INTO admin_settings (
    id,
    referral_l1_percent,
    referral_l2_percent,
    referral_l3_percent,
    bank_name,
    bank_account_name,
    bank_account_number,
    easypaisa_account_name,
    easypaisa_account_number
) VALUES (
    1,
    5.0,  -- Level 1: 5% commission
    3.0,  -- Level 2: 3% commission
    2.0,  -- Level 3: 2% commission
    'HBL Bank',
    'SmartGrow Mining',
    '1234567890123456',
    'SmartGrow Corp',
    '03001234567'
) ON CONFLICT (id) DO UPDATE SET
    referral_l1_percent = EXCLUDED.referral_l1_percent,
    referral_l2_percent = EXCLUDED.referral_l2_percent,
    referral_l3_percent = EXCLUDED.referral_l3_percent,
    bank_name = EXCLUDED.bank_name,
    bank_account_name = EXCLUDED.bank_account_name,
    bank_account_number = EXCLUDED.bank_account_number,
    easypaisa_account_name = EXCLUDED.easypaisa_account_name,
    easypaisa_account_number = EXCLUDED.easypaisa_account_number;
