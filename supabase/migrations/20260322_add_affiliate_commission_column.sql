-- Add affiliate_commission column to track referral commissions directly
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10, 2) DEFAULT 0;
