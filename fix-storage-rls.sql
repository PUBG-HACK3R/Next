-- Fix Supabase Storage RLS policies for deposit_proofs bucket
-- The file upload is failing due to storage RLS policies

-- Check current storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'deposit_proofs';

-- Check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'deposit_proofs';

-- Create more permissive storage policies
-- Allow authenticated users to upload files
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'allow_authenticated_uploads',
  'deposit_proofs',
  'Allow authenticated users to upload',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT'
) ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.role() = ''authenticated''',
  check_expression = 'auth.role() = ''authenticated''';

-- Allow users to read their own files
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'allow_user_read_own_files',
  'deposit_proofs',
  'Allow users to read own files',
  'auth.uid()::text = (storage.foldername(name))[1]',
  NULL,
  'SELECT'
) ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.uid()::text = (storage.foldername(name))[1]';

-- Allow admins to read all files
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'allow_admin_read_all',
  'deposit_proofs',
  'Allow admins to read all files',
  'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_level >= 999)',
  NULL,
  'SELECT'
) ON CONFLICT (id) DO UPDATE SET
  definition = 'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_level >= 999)';

-- Verify the policies
SELECT * FROM storage.policies WHERE bucket_id = 'deposit_proofs';
