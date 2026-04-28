-- Add payment proof columns to affiliates table
-- These columns support the manual approval workflow for affiliate registration

ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_ref TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_submitted_at TIMESTAMPTZ;

-- Add index for faster queries on payment proof submission
CREATE INDEX IF NOT EXISTS idx_affiliates_payment_proof_submitted_at
ON affiliates(payment_proof_submitted_at);
