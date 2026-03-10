import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../common/types/supabase.types'
import { env } from './env'

// Public client — respects RLS, used for all user-facing auth
export const supabase: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

// Admin client — service role key, bypasses RLS (server-side only — never expose to frontend)
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)