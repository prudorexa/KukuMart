// src/lib/supabase.js
// Never throw at import time: a throw here crashes the whole app into a blank
// white page. Instead export `supabaseConfigError` so the UI can show it.

import { createClient } from "@supabase/supabase-js";

const clean = (v) => (v ?? "").trim().replace(/^["']|["']$/g, "");

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const apiKey      = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseConfigError = !supabaseUrl
  ? "VITE_SUPABASE_URL is missing. Add it to .env (local) or your host's environment variables, then restart/redeploy."
  : !apiKey
  ? "VITE_SUPABASE_ANON_KEY is missing. Add it to .env (local) or your host's environment variables, then restart/redeploy."
  : null;

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  apiKey || "placeholder-key",
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);

if (supabaseConfigError) console.error("❌ " + supabaseConfigError);
else console.log("✓ Supabase client ready:", supabaseUrl.split("//")[1]);