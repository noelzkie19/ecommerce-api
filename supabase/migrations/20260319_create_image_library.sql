/**
 * Image Library Table Migration
 * 
 * Creates the image_library table for storing images with categories.
 * 
 * Categories: banners, gallery, testimonials, partners
 * Fields: title, category, thumbnail_url, image_url, description, display_order, is_active
 */

-- Create image_library table
CREATE TABLE IF NOT EXISTS image_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'gallery',
  thumbnail_url TEXT,
  image_url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_image_library_category ON image_library(category);
CREATE INDEX idx_image_library_display_order ON image_library(display_order);
CREATE INDEX idx_image_library_is_active ON image_library(is_active);

-- Enable Row Level Security
ALTER TABLE image_library ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active images
CREATE POLICY "Public can view active image library items"
ON image_library FOR SELECT
USING (is_active = true);

-- Policy: Authenticated admins can manage image library
CREATE POLICY "Admins can manage image library"
ON image_library FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM auth.users
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add comment for documentation
COMMENT ON TABLE image_library IS 'Stores images for the image library with categories (banners, gallery, testimonials, partners)';

COMMENT ON COLUMN image_library.title IS 'Display title for the image';
COMMENT ON COLUMN image_library.category IS 'Category: banners, gallery, testimonials, partners';
COMMENT ON COLUMN image_library.thumbnail_url IS 'URL for thumbnail version of the image';
COMMENT ON COLUMN image_library.image_url IS 'URL for the full-size image';
COMMENT ON COLUMN image_library.description IS 'Optional description of the image';
COMMENT ON COLUMN image_library.display_order IS 'Order for display (lower values appear first)';
COMMENT ON COLUMN image_library.is_active IS 'Whether the image is active and visible';
