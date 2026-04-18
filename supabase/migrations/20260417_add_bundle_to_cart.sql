-- Cart and Order Bundle Integration Migration
-- Date: 2026-04-17
-- Description: Adds product_bundle_id to cart_items and order_items tables

-- Step 1: Add product_bundle_id column to cart_items table
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_bundle_id UUID REFERENCES product_bundles(id) ON DELETE SET NULL;

-- Step 2: Create index for product_bundle_id in cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_product_bundle_id ON cart_items(product_bundle_id);

-- Step 3: Add product_bundle_id column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_bundle_id UUID REFERENCES product_bundles(id) ON DELETE SET NULL;

-- Step 4: Create index for product_bundle_id in order_items
CREATE INDEX IF NOT EXISTS idx_order_items_product_bundle_id ON order_items(product_bundle_id);

-- Step 5: Verify columns were added
SELECT 
    (SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'product_bundle_id') as cart_bundle_col,
    (SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_bundle_id') as order_bundle_col;