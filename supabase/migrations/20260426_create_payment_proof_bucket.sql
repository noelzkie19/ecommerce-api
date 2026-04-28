-- Create payment_proof bucket and policies
-- This bucket stores affiliate payment proof images

-- Step 1: Create the payment_proof bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'payment_proof', 'payment_proof', true, 5242880, '{"image/jpeg","image/png","image/webp","image/gif"}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'payment_proof');

-- Step 2: Ensure the bucket is set to public (update if exists)
UPDATE storage.buckets SET public = true WHERE id = 'payment_proof';

-- Step 3: Drop existing policies for the payment_proof bucket
DROP POLICY IF EXISTS "Public read access for payment_proof bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to payment_proof bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update payment_proof files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete payment_proof files" ON storage.objects;

-- Step 4: Create policies for the payment_proof bucket
-- Allow public read access to all files in payment_proof bucket
CREATE POLICY "Public read access for payment_proof bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment_proof');

-- Allow authenticated users to upload files to payment_proof bucket
CREATE POLICY "Allow uploads to payment_proof bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment_proof');

-- Allow authenticated users to update their files in payment_proof bucket
CREATE POLICY "Authenticated users can update payment_proof files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'payment_proof');

-- Allow authenticated users to delete their files in payment_proof bucket
CREATE POLICY "Authenticated users can delete payment_proof files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'payment_proof');
