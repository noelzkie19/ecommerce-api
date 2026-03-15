-- Add payment_status column to affiliates table
-- This allows tracking whether an affiliate has completed payment before activation

ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid'));

-- Note: This column is automatically set to 'unpaid' when a new user registers
-- and updated to 'paid' when they complete their first order payment
