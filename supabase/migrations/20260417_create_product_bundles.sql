-- Product Bundles Migration
-- Date: 2026-04-17
-- Description: Creates the product_bundles table for storing bundle pricing options

-- Create product_bundles table
CREATE TABLE IF NOT EXISTS product_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "Buy 3 - Save 15%"
    bundle_qty INTEGER NOT NULL, -- e.g., 3
    bundle_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_product_bundles_product_id ON product_bundles(product_id);

-- Index for active bundles
CREATE INDEX IF NOT EXISTS idx_product_bundles_is_active ON product_bundles(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can read active bundles
CREATE POLICY "Public can view active product bundles"
ON product_bundles FOR SELECT
USING (is_active = true);

-- RLS Policy: Service role can do anything with bundles
CREATE POLICY "Service role can manage product bundles"
ON product_bundles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify product_bundles table was created
SELECT 
    COUNT(*) as bundles_count
FROM product_bundles;