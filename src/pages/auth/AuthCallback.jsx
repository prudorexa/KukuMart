// src/pages/auth/AuthCallback.jsx
// Handles the redirect from Google OAuth back to our app.
// Supabase sets the session automatically from the URL hash —
// we just need to wait, create a profile if new, then redirect.

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [error,        setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      // Supabase automatically handles the OAuth hash/code from the URL.
      // getSession() returns the new session after the redirect.
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr || !session) {
        setError(sessionErr?.message ?? "Authentication failed. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      const user = session.user;

      // Create profile row if this is the user's first sign-in
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existing) {
        await supabase.from("profiles").insert([{
          id:             user.id,
          full_name:      user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
          email:          user.email ?? null,
          avatar_url:     user.user_metadata?.avatar_url ?? null,
          created_at:     new Date().toISOString(),
          loyalty_points: 0,
          loyalty_tier:   "bronze",
        }]);
      }

      // Redirect to the page they were trying to reach
      const next = searchParams.get("next") ?? "/dashboard";
      navigate(decodeURIComponent(next), { replace: true });
    }

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Sign-in failed</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <p className="text-xs text-gray-400">Redirecting you back to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-[#C8290A] rounded-2xl flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <ellipse cx="20" cy="27" rx="10" ry="11" fill="white"/>
            <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white"/>
            <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130"/>
            <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130"/>
            <circle cx="24" cy="12.5" r="1.7" fill="#C8290A"/>
          </svg>
        </div>
        <div className="w-5 h-5 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}