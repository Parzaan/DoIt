import { createClient } from '@supabase/supabase-js';

// These variables look for the keys in your .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This creates the "handshake" between your app and Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);