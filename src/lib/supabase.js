// src/lib/supabase.js
// Supports both new publishable key format (sb_publishable_...) 
// and legacy anon key format (eyJ...)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const publishableKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const legacyKey       = import.meta.env.VITE_SUPABASE_LEGACY_KEY;

if (!supabaseUrl) {
  throw new Error("❌ FATAL: Missing VITE_SUPABASE_URL in .env");
}
if (!publishableKey && !legacyKey) {
  throw new Error("❌ FATAL: Missing Supabase API key in .env");
}

// Use publishable key if available, fall back to legacy anon key
const apiKey = publishableKey || legacyKey;

export const supabase = createClient(supabaseUrl, apiKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

console.log("✓ Supabase client ready:", supabaseUrl.split("//")[1]);
