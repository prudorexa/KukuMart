// src/pages/auth/ResetPassword.jsx
// Handles the link from "Reset Your Password" email.
// Supabase redirects to: /auth/reset-password#access_token=...
// We extract the token, let the user set a new password, then sign them in.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function Logo() {
  return (
    <div className="w-14 h-14 bg-[#C8290A] rounded-2xl flex items-center justify-center mx-auto">
      <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
        <ellipse cx="20" cy="27" rx="10" ry="11" fill="white"/>
        <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white"/>
        <ellipse cx="16.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130"/>
        <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130"/>
        <ellipse cx="23.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130"/>
        <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130"/>
        <circle cx="24" cy="12.5" r="1.7" fill="#C8290A"/>
      </svg>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");
  const [tokenReady,setTokenReady]= useState(false);

  // Supabase puts the recovery token in the URL hash — it handles it automatically
  // via onAuthStateChange. We just need to wait for the PASSWORD_RECOVERY event.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTokenReady(true);
      }
    });

    // Also check if there's already an active session from the link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setTokenReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true); setError("");

    const { error: sbErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (sbErr) { setError(sbErr.message); return; }

    setDone(true);
    setTimeout(() => navigate("/dashboard"), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Logo/>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Kuku<span className="text-[#C8290A]">Mart</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Set your new password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {done ? (
            // Success state
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Password updated!</h3>
              <p className="text-sm text-gray-500">Your password has been changed successfully. Taking you to your dashboard…</p>
            </div>
          ) : !tokenReady ? (
            // Waiting for token
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-8 h-8 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin"/>
              <p className="text-sm text-gray-500">Verifying your reset link…</p>
              <p className="text-xs text-gray-400">
                If this takes too long,{" "}
                <button onClick={() => navigate("/login")} className="text-[#C8290A] hover:underline font-medium">
                  go back to login
                </button>
              </p>
            </div>
          ) : (
            // Password form
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="At least 6 characters"
                  autoFocus
                  autoComplete="new-password"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
                    confirm && confirm !== password ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || password !== confirm}
                className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</>
                  : "Set new password"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-5">
          <button onClick={() => navigate("/login")} className="text-xs text-gray-400 hover:text-[#C8290A] transition-colors">
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}