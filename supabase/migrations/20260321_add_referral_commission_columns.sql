-- Fix affiliate_sales table to support both product sales and referral commissions
-- The original table was missing several columns used by the service layer

-- 1. Make order_id nullable (referral commissions don't have an order)
ALTER TABLE affiliate_sales 
ALTER COLUMN order_id DROP NOT NULL;

-- 2. Add order_item_id for product sale tracking (upsert key)
ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS order_item_id UUID;

-- 3. Add quantity for product sales
ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- 4. Add commission_type and commission_value for product sales
ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed'));

ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS commission_value DECIMAL(10, 2) DEFAULT 0;

-- 5. Add commission_earned (the actual earned amount, replaces commission_amount)
ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS commission_earned DECIMAL(10, 2);

-- Sync existing commission_amount values to commission_earned
UPDATE affiliate_sales 
SET commission_earned = commission_amount 
WHERE commission_earned IS NULL AND commission_amount IS NOT NULL;

-- 6. Add type column to distinguish product sales vs referral commissions
ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'sale' CHECK (type IN ('sale', 'referral'));

-- 7. Add referred_affiliate_id to track which new affiliate triggered the commission
ALTER TABLE affiliate_sales 
ADD COLUMN IF NOT EXISTS referred_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;

-- 8. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_type ON affiliate_sales(type);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_order_item_id ON affiliate_sales(order_item_id) WHERE order_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_referred_affiliate_id ON affiliate_sales(referred_affiliate_id) WHERE referred_affiliate_id IS NOT NULL;

-- 9. Add unique constraint on order_item_id for upsert idempotency (product sales)
-- First, set a temporary placeholder for NULL values to allow the constraint
-- Then add the constraint
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'affiliate_sales_order_item_id_key'
  ) THEN
    -- Update any existing NULL order_item_id values to a placeholder
    -- This is needed because PostgreSQL unique constraints don't allow multiple NULLs
    UPDATE affiliate_sales 
    SET order_item_id = uuid_generate_v4()
    WHERE order_item_id IS NULL;
    
    -- Now add the unique constraint
    ALTER TABLE affiliate_sales ADD CONSTRAINT affiliate_sales_order_item_id_key UNIQUE (order_item_id);
  END IF;
END $$;
