-- Add missing columns to orders table for checkout functionality
-- This migration adds fields needed for the new order placement flow

-- Add guest_id column for guest checkout
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_id UUID;

-- Add customer contact and shipping info
ALTER TABLE orders ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email TEXT NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_notes TEXT;

-- Add payment information
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) CHECK (payment_method IN ('gcash', 'cod', 'card'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add discount field
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;

-- Add affiliate tracking fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS click_id TEXT;

-- Update status to match our app's status values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Drop old columns that are no longer needed (if they exist)
-- These were from the old schema
ALTER TABLE orders DROP COLUMN IF EXISTS shipping;
ALTER TABLE orders DROP COLUMN IF EXISTS tax;
ALTER TABLE orders DROP COLUMN IF EXISTS shipped_to;

-- Create index for guest_id
CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);

-- Create index for payment_intent_id
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);

-- Create index for affiliate_id
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for order_items order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Create index for order_items product_id
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
