-- Fix storage bucket permissions for file uploads
-- This needs to be run in Supabase SQL editor or through Supabase Dashboard

-- Check if deposit_proofs bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'deposit_proofs';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit_proofs', 'deposit_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for deposit_proofs bucket
-- Allow authenticated users to upload files
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'allow_authenticated_uploads_deposit_proofs',
  'deposit_proofs',
  'Allow authenticated users to upload deposit proofs',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated''',
  'INSERT'
) ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.role() = ''authenticated''',
  check_expression = 'auth.role() = ''authenticated''';

-- Allow users to read files
INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command)
VALUES (
  'allow_read_deposit_proofs',
  'deposit_proofs',
  'Allow reading deposit proofs',
  'auth.role() = ''authenticated''',
  NULL,
  'SELECT'
) ON CONFLICT (id) DO UPDATE SET
  definition = 'auth.role() = ''authenticated''';

-- Verify policies were created
SELECT * FROM storage.policies WHERE bucket_id = 'deposit_proofs';
