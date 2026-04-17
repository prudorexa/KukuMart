// src/lib/supabase.js
// Make sure your .env file has these two variables:
//   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ FATAL: Missing Supabase environment variables!\n" +
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\n" +
    "Current values: URL=" + (supabaseUrl ? "✓" : "✗") + ", KEY=" + (supabaseAnonKey ? "✓" : "✗")
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("✓ Supabase connected:", supabaseUrl.split("/")[2]);