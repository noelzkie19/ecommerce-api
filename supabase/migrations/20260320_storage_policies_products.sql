-- Storage Policies for "products" bucket
-- This script creates the necessary policies for the image library upload functionality
-- Run this in Supabase SQL Editor

-- =====================================================
-- POLICY: Allow public read access to all files in products bucket
-- =====================================================
DROP POLICY IF EXISTS "Public read access for products bucket" ON storage.objects;
CREATE POLICY "Public read access for products bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- =====================================================
-- POLICY: Allow authenticated users to upload files
-- =====================================================
DROP POLICY IF EXISTS "Allow uploads to products bucket" ON storage.objects;
CREATE POLICY "Allow uploads to products bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- =====================================================
-- POLICY: Allow authenticated users to update their files
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can update products files" ON storage.objects;
CREATE POLICY "Authenticated users can update products files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'products');

-- =====================================================
-- POLICY: Allow authenticated users to delete their files
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can delete products files" ON storage.objects;
CREATE POLICY "Authenticated users can delete products files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'products');
