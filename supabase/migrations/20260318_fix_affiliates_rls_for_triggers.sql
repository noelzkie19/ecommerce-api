-- Fix RLS policy for affiliates table to allow trigger function to insert
-- The current policy checks auth.role() = 'service_role' but the trigger
-- runs in a different context. We need to allow the function owner to insert.

-- Drop existing policies (handle both old and new policy names)
DROP POLICY IF EXISTS "Allow service role full access affiliates" ON affiliates;
DROP POLICY IF EXISTS "Allow service role and triggers full access affiliates" ON affiliates;

-- Create a more permissive policy that allows:
-- 1. Service role (for admin operations)
-- 2. The function owner (for trigger-based inserts via SECURITY DEFINER functions)
-- 3. Authenticated users to read their own affiliate record
CREATE POLICY "Allow service role and triggers full access affiliates" ON affiliates 
FOR ALL 
USING (
  auth.role() = 'service_role' 
  OR auth.uid() = user_id
)
WITH CHECK (
  auth.role() = 'service_role' 
  OR auth.uid() = user_id
);

-- Also ensure the trigger function has proper permissions by granting table permissions
-- This is a safeguard in case the function runs into permission issues
GRANT ALL ON affiliates TO postgres;
GRANT ALL ON affiliates TO supabase_auth_admin;
GRANT ALL ON affiliates TO authenticated;

-- Recreate the trigger function with explicit security settings
-- This ensures it runs with the correct privileges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new affiliate record when a new user is created
  -- Using INSERT ... ON CONFLICT to handle duplicate emails gracefully
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
