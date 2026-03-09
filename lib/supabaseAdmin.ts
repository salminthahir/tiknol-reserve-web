import { createClient } from '@supabase/supabase-js';

// Pastikan environment variables ini tersedia (terutama SUPABASE_SERVICE_ROLE_KEY di server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Missing Supabase URL or Service Role Key in environment variables.');
}

// Client ini HANYA boleh dipakai di server (API Routes / Server Actions)
// karena menggunakan Service Role Key yang memiliki akses bypass RLS.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
