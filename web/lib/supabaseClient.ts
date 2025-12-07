import {createClient, SupabaseClient} from '@supabase/supabase-js';

// Public client for browser usage
export const supabaseClient: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

// Admin client for server-side operations (use SERVICE ROLE key)
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

export default supabaseClient;
