import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

type SupabaseClientType = SupabaseClient<any>;

// Public client — respects RLS, used for all user-facing auth
export const supabase: SupabaseClientType = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
);

// Admin client — service role key, bypasses RLS (server-side only — never expose to frontend)
export const supabaseAdmin: SupabaseClientType = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
