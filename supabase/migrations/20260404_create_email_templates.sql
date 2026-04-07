-- Create email_templates table for storing email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  category TEXT NOT NULL CHECK (category IN ('order', 'affiliate', 'auth', 'system')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast template lookups by key
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON email_templates (template_key);

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates (category);

-- Enable RLS (service_role bypasses it)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
