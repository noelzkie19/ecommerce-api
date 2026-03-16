-- Fix handle_new_user trigger - DON'T generate affiliate_link on registration
-- Affiliate link will be generated AFTER successful payment instead

-- Step 1: Simple trigger - no affiliate_link generation (it will be set after payment)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert affiliate record WITHOUT affiliate_link (will be set after payment)
    INSERT INTO public.affiliates (user_id, name, email, status, payment_status, store_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'pending',
        'unpaid',
        'store_' || lower(encode(gen_random_bytes(8), 'hex'))
    )
    ON CONFLICT (email) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
