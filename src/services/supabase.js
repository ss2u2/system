import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize client only if credentials are provided in .env
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Persist session in localStorage so users stay logged in on reload
        persistSession: true,
        // Auto-refresh tokens before they expire
        autoRefreshToken: true,
        // Detect the OAuth callback hash/code in the URL on page load
        detectSessionInUrl: true,
      },
    })
  : null;

if (!supabase) {
  console.warn(
    'Supabase configuration is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  );
}
