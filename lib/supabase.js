import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdmin = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export const ASSETS_BUCKET_URL = process.env.NEXT_PUBLIC_ASSETS_BUCKET_URL || '';