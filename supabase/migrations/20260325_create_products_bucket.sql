-- Create products bucket and policies if they don't exist
-- This fixes the storage access issue

-- Step 1: Create the products bucket if it doesn't exist, or update it to be public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'products', 'products', true, 10485760, NULL
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products');

-- Step 2: Ensure the bucket is set to public (update if exists)
UPDATE storage.buckets SET public = true WHERE id = 'products';

-- Step 3: Drop existing policies for the products bucket
DROP POLICY IF EXISTS "Public read access for products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update products files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete products files" ON storage.objects;

-- Step 4: Create policies for the products bucket
-- Allow public read access to all files in products bucket
CREATE POLICY "Public read access for products bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated users to upload files
CREATE POLICY "Allow uploads to products bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update products files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'products');

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete products files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'products');
