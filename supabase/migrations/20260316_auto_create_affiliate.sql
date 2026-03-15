-- Auto-create Affiliate on User Registration
-- This migration adds 'pending' status, payment_status field, store_id, and creates a trigger 
-- to automatically create an affiliate record when a new user registers

-- Step 1: Add payment_status column to affiliates (if not exists)
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid'));

-- Step 2: Drop existing CHECK constraint and add new one with 'pending' status
ALTER TABLE affiliates 
DROP CONSTRAINT IF EXISTS affiliates_status_check;

ALTER TABLE affiliates 
ADD CONSTRAINT affiliates_status_check 
CHECK (status IN ('pending', 'active', 'suspended'));

-- Step 3: Create function to auto-create affiliate on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new affiliate record when a new user is created
  INSERT INTO public.affiliates (user_id, name, email, status, payment_status, store_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'pending',
    'unpaid',
    'store_' || lower(hex(random()::bigint * 9223372036854775807 + 9223372036854775808)::text)
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create a function to manually sync existing users to affiliates
-- Run this if you want to create affiliate records for existing users
-- SELECT * FROM public.sync_existing_users_to_affiliates();

CREATE OR REPLACE FUNCTION public.sync_existing_users_to_affiliates()
RETURNS void AS $$
DECLARE
  existing_user RECORD;
BEGIN
  FOR existing_user IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE email IS NOT NULL
  LOOP
    INSERT INTO public.affiliates (user_id, name, email, status, payment_status, store_id)
    VALUES (
      existing_user.id,
      COALESCE(existing_user.raw_user_meta_data->>'full_name', existing_user.raw_user_meta_data->>'name', SPLIT_PART(existing_user.email, '@', 1)),
      existing_user.email,
      'pending',
      'unpaid',
      'store_' || lower(hex(random()::bigint * 9223372036854775807 + 9223372036854775808)::text)
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Run this to sync existing users (uncomment if needed):
-- SELECT * FROM public.sync_existing_users_to_affiliates();
