-- Affiliate System with Meta Pixel Integration
-- Migration: Adds tracking links, attributions, pixel events, and order updates

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Affiliate Tracking Links Table ───────────────────────────────────────────────
-- Stores generated affiliate tracking links
CREATE TABLE IF NOT EXISTS affiliate_tracking_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
    store_id TEXT NOT NULL,
    campaign_name TEXT,
    landing_page_url TEXT,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(affiliate_id, store_id, campaign_name)
);

-- ── Affiliate Attributions Table ─────────────────────────────────────────────────
-- Stores attribution data for each order
CREATE TABLE IF NOT EXISTS affiliate_attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
    tracking_method VARCHAR(20) NOT NULL CHECK (tracking_method IN ('cookie', 'url_param', 'manual')),
    pixel_id TEXT,
    store_id TEXT,
    click_id TEXT,
    referrer_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Affiliate Pixel Events Table ───────────────────────────────────────────────
-- Logs Meta Pixel events fired for each conversion
CREATE TABLE IF NOT EXISTS affiliate_pixel_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Purchase', 'Lead', 'ViewContent', 'AddToCart', 'CompleteRegistration', 'PageView')),
    pixel_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    meta_response JSONB,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- ── Update Affiliates Table ────────────────────────────────────────────────────
-- Add enhanced pixel settings to existing affiliates table
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS pixel_access_token TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS enable_purchase_event BOOLEAN DEFAULT true;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS enable_lead_event BOOLEAN DEFAULT false;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS conversion_value_type VARCHAR(20) DEFAULT 'sale_amount' CHECK (conversion_value_type IN ('sale_amount', 'commission', 'fixed'));
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS conversion_value_fixed DECIMAL(10, 2);

-- ── Update Orders Table ────────────────────────────────────────────────────────
-- Add affiliate tracking fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_method VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS click_id TEXT;

-- ── Create Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_links_affiliate_id ON affiliate_tracking_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_links_store_id ON affiliate_tracking_links(store_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_order_id ON affiliate_attributions(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_affiliate_id ON affiliate_attributions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_pixel_events_affiliate_id ON affiliate_pixel_events(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_pixel_events_order_id ON affiliate_pixel_events(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_pixel_events_status ON affiliate_pixel_events(status);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

-- ── Enable Row Level Security ─────────────────────────────────────────────────
ALTER TABLE affiliate_tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_pixel_events ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ───────────────────────────────────────────────────────────────
-- Affiliate Tracking Links: Service role only
CREATE POLICY "Allow service role full access affiliate_tracking_links" ON affiliate_tracking_links FOR ALL USING (auth.role() = 'service_role');

-- Affiliate Attributions: Service role only
CREATE POLICY "Allow service role full access affiliate_attributions" ON affiliate_attributions FOR ALL USING (auth.role() = 'service_role');

-- Affiliate Pixel Events: Service role only
CREATE POLICY "Allow service role full access affiliate_pixel_events" ON affiliate_pixel_events FOR ALL USING (auth.role() = 'service_role');
