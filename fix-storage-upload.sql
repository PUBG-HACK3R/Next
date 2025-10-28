-- Temporarily disable RLS on storage.objects to allow uploads
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, run these policies instead:
-- (Comment out the line above and uncomment the policies below)

/*
-- Allow all authenticated users to upload to deposit-proofs bucket
CREATE POLICY "Allow uploads to deposit-proofs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'deposit-proofs');

-- Allow public read access to deposit-proofs bucket  
CREATE POLICY "Allow public reads from deposit-proofs" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'deposit-proofs');
*/
