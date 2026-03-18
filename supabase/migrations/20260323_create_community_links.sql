-- Community Links Migration
-- Creates the community_links table for storing external links displayed on the client

-- Create community_links table
CREATE TABLE IF NOT EXISTS community_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  icon TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active links
CREATE POLICY "Public can view active community links"
ON community_links FOR SELECT
USING (is_active = true);

-- Allow authenticated users full access (admin)
CREATE POLICY "Authenticated users can manage community links"
ON community_links FOR ALL
USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_community_links_category ON community_links(category);
CREATE INDEX IF NOT EXISTS idx_community_links_order ON community_links(order_index);
CREATE INDEX IF NOT EXISTS idx_community_links_active ON community_links(is_active) WHERE is_active = true;

-- Insert sample data
INSERT INTO community_links (title, url, category, icon, order_index, is_active) VALUES
  ('YouTube Channel', 'https://youtube.com/@example', 'youtube', 'youtube', 1, true),
  ('Facebook Page', 'https://facebook.com/example', 'facebook', 'facebook', 2, true),
  ('Telegram Group', 'https://t.me/example', 'telegram', 'telegram', 3, true),
  ('Discord Server', 'https://discord.gg/example', 'discord', 'discord', 4, true),
  ('Official Website', 'https://example.com', 'website', 'globe', 5, true)
ON CONFLICT DO NOTHING;
