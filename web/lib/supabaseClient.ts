import {createClient, SupabaseClient} from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

// Singleton for public client (browser)
export function supabaseClient() {
  if (browserClient) return browserClient;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  
  browserClient = createClient(url, anon);
  return browserClient;
}

// Lazy factory for admin client (server)
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin operations');
  return createClient(url, key);
}

export default supabaseClient;
