// src/components/SupabaseDiag.jsx
// Shown when Supabase is unreachable — gives the developer exact steps to fix it.
// Import and render this anywhere you get a "fetch failed" / network error.

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const PROJECT_ID   = SUPABASE_URL.split("//")[1]?.split(".")[0] ?? "unknown";

export default function SupabaseDiag({ context = "this page" }) {
  const [status,  setStatus]  = useState("checking"); // checking | ok | fail
  const [details, setDetails] = useState("");

  useEffect(() => {
    async function ping() {
      try {
        // Lightweight ping — just check if the API responds at all
        const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok || res.status === 404) {
          // 404 is fine — means the server is alive, just no route matched
          setStatus("ok");
        } else {
          setStatus("fail");
          setDetails(`Server responded with HTTP ${res.status}`);
        }
      } catch (err) {
        setStatus("fail");
        if (err?.name === "TimeoutError") {
          setDetails("Request timed out after 6 seconds — project may be paused.");
        } else {
          setDetails(err?.message ?? "Unknown network error");
        }
      }
    }
    ping();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
        <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"/>
        Checking connection…
      </div>
    );
  }

  if (status === "ok") return null; // Connection is fine, don't show anything

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 my-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔌</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-orange-900 mb-1">
            Cannot reach Supabase — {context} won't load
          </p>
          <p className="text-xs text-orange-700 mb-3 leading-relaxed">
            Your app is connected to project <code className="bg-orange-100 px-1 rounded font-mono">{PROJECT_ID}</code>,
            but that project is not responding.
          </p>
          {details && (
            <p className="text-xs font-mono text-orange-600 bg-orange-100 rounded-lg px-3 py-2 mb-3 break-all">
              Error: {details}
            </p>
          )}

          <p className="text-xs font-bold text-orange-900 mb-2">Most likely causes:</p>
          <ol className="text-xs text-orange-800 space-y-1.5 list-decimal list-inside leading-relaxed mb-4">
            <li>
              <strong>Project is paused</strong> — Free Supabase projects pause after 1 week of inactivity.
              Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
                className="underline font-semibold">supabase.com/dashboard</a> and click <strong>Restore</strong>.
            </li>
            <li>
              <strong>Wrong project URL</strong> — Check your <code className="bg-orange-100 px-1 rounded font-mono">.env</code> file.
              <code className="block bg-orange-100 rounded px-2 py-1 mt-1 font-mono text-[10px] break-all">
                VITE_SUPABASE_URL={SUPABASE_URL || "(not set)"}
              </code>
            </li>
            <li>
              <strong>Project deleted</strong> — Create a new Supabase project and update your <code className="bg-orange-100 px-1 rounded font-mono">.env</code> with the new URL and anon key.
            </li>
          </ol>

          <div className="bg-white border border-orange-200 rounded-xl p-3">
            <p className="text-xs font-bold text-orange-900 mb-1.5">📋 After restoring your project, run this SQL:</p>
            <pre className="text-[10px] text-green-700 bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">{`-- 1. Allow public to read products
alter table products enable row level security;
create policy "Anyone can view products"
  on products for select using (true);

-- 2. Allow logged-in users to manage their orders
alter table orders enable row level security;
alter table orders add column if not exists
  user_id uuid references auth.users(id);

create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders"
  on orders for insert with check (auth.uid() = user_id);`}</pre>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Open Supabase Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
