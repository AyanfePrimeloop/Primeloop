import { createClient } from '@supabase/supabase-js';

// DANGER: this client bypasses Row Level Security entirely.
// Only ever import this inside pages/api/** (server-side code) — never in
// a component that runs in the browser, or you'll leak full database access.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
