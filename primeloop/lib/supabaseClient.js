import { createClient } from '@supabase/supabase-js';

// This client is safe to use in the browser (React components, pages).
// It respects Row Level Security — an engager can only ever see/edit their own data.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
