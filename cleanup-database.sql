-- COMPLETE DATABASE CLEANUP SCRIPT
-- This will delete all user data including deposits, withdrawals, investments, transactions, and commissions

-- Step 1: Disable foreign key constraints temporarily
ALTER TABLE deposits DISABLE TRIGGER ALL;
ALTER TABLE withdrawals DISABLE TRIGGER ALL;
ALTER TABLE investments DISABLE TRIGGER ALL;
ALTER TABLE income_transactions DISABLE TRIGGER ALL;
ALTER TABLE referral_commissions DISABLE TRIGGER ALL;
ALTER TABLE bonus_transactions DISABLE TRIGGER ALL;

-- Step 2: Delete all data
-- Delete referral commissions
DELETE FROM referral_commissions;

-- Delete bonus transactions
DELETE FROM bonus_transactions;

-- Delete income transactions
DELETE FROM income_transactions;

-- Delete investments (active and completed plans)
DELETE FROM investments;

-- Delete withdrawals
DELETE FROM withdrawals;

-- Delete deposits
DELETE FROM deposits;

-- Step 3: Re-enable triggers
ALTER TABLE deposits ENABLE TRIGGER ALL;
ALTER TABLE withdrawals ENABLE TRIGGER ALL;
ALTER TABLE investments ENABLE TRIGGER ALL;
ALTER TABLE income_transactions ENABLE TRIGGER ALL;
ALTER TABLE referral_commissions ENABLE TRIGGER ALL;
ALTER TABLE bonus_transactions ENABLE TRIGGER ALL;

-- Step 4: Reset sequences (auto-increment counters)
ALTER SEQUENCE deposits_id_seq RESTART WITH 1;
ALTER SEQUENCE withdrawals_id_seq RESTART WITH 1;
ALTER SEQUENCE investments_id_seq RESTART WITH 1;
ALTER SEQUENCE income_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE referral_commissions_id_seq RESTART WITH 1;
ALTER SEQUENCE bonus_transactions_id_seq RESTART WITH 1;

-- Verification
SELECT 'Deposits deleted' as status, COUNT(*) as remaining FROM deposits
UNION ALL
SELECT 'Withdrawals deleted', COUNT(*) FROM withdrawals
UNION ALL
SELECT 'Investments deleted', COUNT(*) FROM investments
UNION ALL
SELECT 'Income transactions deleted', COUNT(*) FROM income_transactions
UNION ALL
SELECT 'Referral commissions deleted', COUNT(*) FROM referral_commissions
UNION ALL
SELECT 'Bonus transactions deleted', COUNT(*) FROM bonus_transactions;

SELECT 'Database cleanup completed successfully!' as message;
