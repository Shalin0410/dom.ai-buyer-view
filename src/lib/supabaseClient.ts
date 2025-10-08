import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or anon key is not set. Please check your environment variables.');
}

if (!supabaseServiceKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase service role key is not set. Admin operations will not work.');
}

// Singleton pattern to ensure only one client instance
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'buyer-journey-auth' // Unique storage key to prevent conflicts
      }
    });
  }
  return supabaseInstance;
})();

// Service role client for admin operations (bypasses RLS)
// Note: In production, this should be on the server side only
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance && supabaseServiceKey) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'buyer-journey-admin' // Unique storage key for admin client
      }
    });
  }
  return supabaseAdminInstance;
})();
