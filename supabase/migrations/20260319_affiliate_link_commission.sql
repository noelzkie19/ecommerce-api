-- Affiliate Link & Commission Settings Migration
-- This migration adds:
-- 1. affiliate_link column (unique referral code)
-- 2. referred_by column (track who referred this affiliate)
-- 3. affiliate_settings table (configurable commission rates)
-- 4. Updated trigger to generate unique affiliate link

-- Step 1: Add affiliate_link column to affiliates
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS affiliate_link VARCHAR(50) UNIQUE;

-- Step 2: Add referred_by column to track referral source
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES affiliates(id);

-- Step 3: Create affiliate_settings table for commission configuration
CREATE TABLE IF NOT EXISTS affiliate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert default settings
INSERT INTO affiliate_settings (key, value, description) 
VALUES 
    ('registration_fee', '999', 'Affiliate registration fee in PHP'),
    ('referral_commission_rate', '20', 'Commission percentage for referring new affiliates'),
    ('referral_commission_type', 'percentage', 'Type of commission: percentage or fixed')
ON CONFLICT (key) DO NOTHING;

-- Step 5: Create function to generate unique affiliate link
CREATE OR REPLACE FUNCTION public.generate_affiliate_link(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    link_prefix TEXT;
    random_chars TEXT;
    final_link TEXT;
    attempts INT := 0;
BEGIN
    -- Use first 3 characters of email for prefix
    link_prefix := COALESCE(LEFT(LOWER(REPLACE(user_email, '@', '')), 3), 'aff');
    
    LOOP
        -- Generate random 6 character string
        random_chars := LOWER(
            MD5(RANDOM()::TEXT || NOW()::TEXT)::bytea::text
        );
        random_chars := SUBSTRING(random_chars FROM 1 FOR 6);
        
        final_link := link_prefix || random_chars;
        attempts := attempts + 1;
        
        -- Check if link already exists
        IF NOT EXISTS (SELECT 1 FROM affiliates WHERE affiliate_link = final_link) THEN
            EXIT;
        END IF;
        
        -- Safety break after 100 attempts
        IF attempts > 100 THEN
            final_link := link_prefix || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_link;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update the trigger function to generate affiliate link
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_affiliate_link TEXT;
BEGIN
    -- Generate unique affiliate link
    new_affiliate_link := public.generate_affiliate_link(NEW.email);
    
    -- Check if there's a referring affiliate in the cookie/session
    -- This would be handled by the application layer
    
    -- Insert affiliate record with generated link
    INSERT INTO public.affiliates (user_id, name, email, status, payment_status, store_id, affiliate_link)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'pending',
        'unpaid',
        'store_' || lower(hex(random()::bigint * 9223372036854775807 + 9223372036854775808)::text),
        new_affiliate_link
    )
    ON CONFLICT (email) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to get affiliate settings
CREATE OR REPLACE FUNCTION public.get_affiliate_setting(key TEXT)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT value INTO setting_value 
    FROM affiliate_settings 
    WHERE key = key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to update affiliate settings
CREATE OR REPLACE FUNCTION public.update_affiliate_setting(key TEXT, new_value TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE affiliate_settings 
    SET value = new_value, updated_at = NOW()
    WHERE key = key;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Setting not found: %', key;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Enable RLS on affiliate_settings
ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admin (can read/write)
CREATE POLICY "Admin can manage settings" ON affiliate_settings
    FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Policy for service role (full access)
CREATE POLICY "Service role full access" ON affiliate_settings
    FOR ALL 
    TO service_role 
    USING (true)
    WITH CHECK (true);

-- Step 10: Add unique index on affiliate_link if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_affiliate_link ON affiliates(affiliate_link);

-- Note: Run this to update existing affiliates with affiliate links
-- UPDATE affiliates SET affiliate_link = public.generate_affiliate_link(email) WHERE affiliate_link IS NULL;
