import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or anon key is not set. Please check your environment variables.');
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
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2ViamlvYnRkZWduYWN0eHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI2MDYxOSwiZXhwIjoyMDY5ODM2NjE5fQ.yzAPLkWZHMmouYNCfl0ZeQoKep9P2oMb4RrYsPMSzA4';

export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
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
