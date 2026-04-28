-- Add approval tracking columns to affiliates table
-- These columns support the admin approval workflow for affiliate registration

-- Step 1: Add approval tracking columns
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 2: Update status CHECK constraint to include 'rejected'
-- The original constraint only allowed: 'pending', 'active', 'suspended'
-- We need to add 'rejected' to support the rejection workflow
ALTER TABLE affiliates
DROP CONSTRAINT IF EXISTS affiliates_status_check;

ALTER TABLE affiliates
ADD CONSTRAINT affiliates_status_check
CHECK (status IN ('pending', 'active', 'suspended', 'rejected'));

-- Step 3: Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_affiliates_approved_at
ON affiliates(approved_at);

CREATE INDEX IF NOT EXISTS idx_affiliates_approved_by
ON affiliates(approved_by);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN affiliates.approved_by IS 'User ID of admin who approved this affiliate';
COMMENT ON COLUMN affiliates.approved_at IS 'Timestamp when affiliate was approved';
COMMENT ON COLUMN affiliates.rejection_reason IS 'Reason for rejection if affiliate was rejected';
