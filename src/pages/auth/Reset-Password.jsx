// src/pages/auth/ResetPassword.jsx
//
// Supabase sends password reset links in TWO possible formats:
//
//  A) PKCE flow (new):  /auth/reset-password?code=XXXX
//     → call exchangeCodeForSession(code)
//
//  B) Implicit flow (old): /auth/reset-password#access_token=XXX&type=recovery
//     → Supabase SDK auto-exchanges via onAuthStateChange PASSWORD_RECOVERY
//
// We handle BOTH so it works regardless of which Supabase setting is active.

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();

  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");
  const [tokenReady, setTokenReady] = useState(false);
  const [linkError,  setLinkError]  = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {

      // ── Path A: PKCE — ?code=XXX in the URL ─────────────────────
      const code = searchParams.get("code");
      if (code) {
        console.log("Reset: found PKCE code, exchanging…");
        const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchErr) {
          console.error("PKCE exchange failed:", exchErr.message);
          setLinkError("This reset link has expired or already been used. Please request a new one.");
        } else {
          setTokenReady(true);
        }
        return;
      }

      // ── Path B: Implicit — #access_token=... in the hash ────────
      // Check hash immediately in case it's already been parsed
      const hash = window.location.hash;
      const isRecoveryHash =
        hash.includes("type=recovery") ||
        hash.includes("access_token");

      if (isRecoveryHash) {
        console.log("Reset: found recovery hash token, waiting for SDK…");
      }

      // onAuthStateChange fires PASSWORD_RECOVERY when the SDK parses the hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Reset: auth event =", event);
          if (cancelled) return;
          if (event === "PASSWORD_RECOVERY") {
            setTokenReady(true);
          }
          // SIGNED_IN after a recovery link also means we're ready
          if (event === "SIGNED_IN" && session) {
            setTokenReady(true);
          }
        }
      );

      // Also check if there's already a valid session (user refreshed the page)
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session) {
        console.log("Reset: existing session found, ready.");
        setTokenReady(true);
      }

      // Timeout — if neither path fires after 12s, show link-expired error
      const timer = setTimeout(() => {
        if (!cancelled && !tokenReady) {
          console.warn("Reset: no token received after 12s");
          setLinkError(
            "Could not verify your reset link. It may have expired. " +
            "Please request a new password reset email."
          );
        }
      }, 12000);

      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    }

    const cleanup = bootstrap();
    return () => {
      cancelled = true;
      cleanup?.then?.(fn => fn?.());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)  { setError("Passwords don't match."); return; }

    setLoading(true);
    setError("");

    try {
      const { error: sbErr } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (sbErr) {
        if (sbErr.message?.toLowerCase().includes("network") || sbErr.message?.toLowerCase().includes("fetch")) {
          setError("Network error — cannot reach the server. Check your internet connection or Supabase project status.");
        } else if (sbErr.message?.toLowerCase().includes("session")) {
          setError("Your session expired. Please request a new password reset email and try again.");
        } else {
          setError(sbErr.message);
        }
        return;
      }
      setDone(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    } catch (err) {
      setLoading(false);
      setError("Network error — could not save password. Check your internet connection.");
    }
  }

  // ── Expired / invalid link screen ───────────────────────────────
  if (linkError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <Logo/>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Kuku<span className="text-[#C8290A]">Mart</span>
            </h1>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Link expired</h3>
            <p className="text-sm text-gray-500 mb-5">{linkError}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#C8290A] hover:bg-[#a82008] text-white font-semibold text-sm py-3 rounded-xl transition-colors"
            >
              Back to login → request new link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <Logo/>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Kuku<span className="text-[#C8290A]">Mart</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Set your new password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {done ? (
            // ── Success ──
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Password updated!</h3>
              <p className="text-sm text-gray-500">Your password has been changed. Taking you to your dashboard…</p>
            </div>

          ) : !tokenReady ? (
            // ── Waiting for token ──
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-8 h-8 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin"/>
              <p className="text-sm text-gray-500">Verifying your reset link…</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
                Make sure you opened the link in the same browser. Reset links expire after 1 hour.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-[#C8290A] hover:underline"
              >
                Request a new link instead →
              </button>
            </div>

          ) : (
            // ── New password form ──
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <p className="text-xs text-green-700 font-medium">✓ Link verified — enter your new password below</p>
              </div>

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
