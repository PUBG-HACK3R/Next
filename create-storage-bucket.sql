-- Create the storage bucket for deposit proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'deposit-proofs', 
  'deposit-proofs', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to deposit-proofs" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'deposit-proofs');

-- Create RLS policy for public read access to deposit proof images
CREATE POLICY "Allow public reads from deposit-proofs" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'deposit-proofs');

-- Create RLS policy for authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to deposit-proofs" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'deposit-proofs')
WITH CHECK (bucket_id = 'deposit-proofs');

-- Create RLS policy for authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes from deposit-proofs" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'deposit-proofs');
