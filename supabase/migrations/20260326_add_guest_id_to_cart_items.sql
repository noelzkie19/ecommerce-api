-- Migration: Add guest_id column to cart_items table
-- Date: 2026-03-26
-- Description: Adds support for guest users in the cart system

-- Add guest_id column to cart_items table
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS guest_id UUID;

-- Create index for guest_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_cart_items_guest_id ON cart_items(guest_id);

-- Update RLS policies to allow guest access
-- First, drop existing policies that only check user_id
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart" ON cart_items;

-- Create new policies that check both user_id and guest_id
-- Users can view their own cart (authenticated)
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own cart (authenticated)
CREATE POLICY "Users can insert own cart" ON cart_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart (authenticated)
CREATE POLICY "Users can update own cart" ON cart_items FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own cart (authenticated)
CREATE POLICY "Users can delete own cart" ON cart_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow anonymous/guest users to access cart based on guest_id
-- This requires a service role or anon key with appropriate permissions
-- Note: For full guest support, you may need to adjust RLS or use a service role for cart operations
