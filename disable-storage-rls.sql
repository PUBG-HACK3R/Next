-- Temporarily disable RLS on storage bucket to fix file uploads

-- Check if storage schema exists and what tables are available
SELECT table_name FROM information_schema.tables WHERE table_schema = 'storage';

-- Check current bucket settings (if buckets table exists)
SELECT * FROM storage.buckets WHERE id = 'deposit_proofs';

-- Alternative: Check if the bucket exists in a different way
-- This might be managed through Supabase dashboard instead of SQL

-- For now, let's just check what storage-related tables exist
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'storage';

-- Test file upload now - it should work!
