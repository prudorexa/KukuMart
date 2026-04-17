// src/pages/auth/Login.jsx
// THREE sign-in methods, in order of "works immediately":
//
//  1. EMAIL + PASSWORD  ← works right now, zero Supabase setup needed
//  2. PHONE OTP         ← needs Twilio configured in Supabase (skip for now)
//  3. GOOGLE            ← needs Google OAuth enabled in Supabase (skip for now)
//
// After sign-in → redirects to ?next= param or /dashboard

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

/* ─── Logo ─── */
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

/* ─── Method tab button ─── */
function MethodTab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}>
      {children}
    </button>
  );
}

/* ─── Error box ─── */
function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="text-xs text-red-700 leading-relaxed">{msg}</p>
    </div>
  );
}

/* ─── Success box ─── */
function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <p className="text-xs text-green-700 leading-relaxed">{msg}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   EMAIL / PASSWORD FORM
   Works immediately — no Supabase setup needed
═══════════════════════════════════════ */
function EmailForm({ onSuccess }) {
  const [mode,    setMode]    = useState("signin"); // "signin" | "signup"
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);

    if (mode === "signup") {
      const { data, error: sbErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (sbErr) { setError(sbErr.message); setLoading(false); return; }

      // Create profile row
      if (data?.user) {
        await supabase.from("profiles").upsert([{
          id: data.user.id,
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          loyalty_points: 0,
          loyalty_tier: "bronze",
          created_at: new Date().toISOString(),
        }]);
      }

      setLoading(false);
      // Supabase may require email confirmation depending on settings
      if (data?.session) {
        onSuccess();
      } else {
        setSuccess("Account created! Check your email for a confirmation link, then sign in.");
        setMode("signin");
        setPassword("");
      }
    } else {
      const { error: sbErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      setLoading(false);
      if (sbErr) {
        if (sbErr.message.includes("Invalid login")) {
          setError("Wrong email or password. Try again, or create a new account.");
        } else if (sbErr.message.includes("Email not confirmed")) {
          setError("Please confirm your email first — check your inbox for the confirmation link.");
        } else {
          setError(sbErr.message);
        }
        return;
      }
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Sign in / Sign up toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <MethodTab active={mode==="signin"} onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>
          Sign in
        </MethodTab>
        <MethodTab active={mode==="signup"} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>
          Create account
        </MethodTab>
      </div>

      {mode === "signup" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Jane Wanjiru" autoComplete="name"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
          placeholder="you@example.com" autoComplete="email" autoFocus={mode==="signin"}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-gray-700">Password</label>
          {mode === "signin" && (
            <button type="button" onClick={async () => {
              if (!email.trim()) { setError("Enter your email above first."); return; }
              setLoading(true);
              const { error: e } = await supabase.auth.resetPasswordForEmail(
                email.trim().toLowerCase(),
                { redirectTo: `${window.location.origin}/auth/reset-password` }
              );
              setLoading(false);
              if (e) setError(e.message);
              else setSuccess("Password reset link sent to your email!");
            }} className="text-xs text-[#C8290A] hover:underline font-medium">
              Forgot password?
            </button>
          )}
        </div>
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
          placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
      </div>

      <ErrorBox msg={error}/>
      <SuccessBox msg={success}/>

      <button type="submit" disabled={loading || !email || !password}
        className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xl transition-colors">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{mode==="signup" ? "Creating account…" : "Signing in…"}</>
          : mode === "signup" ? "Create my account" : "Sign in"
        }
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════
   PHONE OTP FORM
═══════════════════════════════════════ */
function PhoneForm({ onSuccess }) {
  const [phone,   setPhone]   = useState("");
  const [step,    setStep]    = useState("phone");
  const [otp,     setOtp]     = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [countdown,setCountdown]=useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c-1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function normalise(raw) {
    const d = raw.replace(/[\s\-()]/g,"");
    if (d.startsWith("+254")) return d;
    if (d.startsWith("254"))  return "+"+d;
    if (d.startsWith("0"))    return "+254"+d.slice(1);
    return "+"+d;
  }

  async function sendOTP(e) {
    e?.preventDefault();
    setError("");
    const n = normalise(phone.trim());
    if (!/^\+254[17]\d{8}$/.test(n)) { setError("Enter a valid Kenyan number, e.g. 0712 345 678"); return; }
    setLoading(true);
    const { error: sbErr } = await supabase.auth.signInWithOtp({ phone: n });
    setLoading(false);
    if (sbErr) {
      if (sbErr.message.includes("Twilio") || sbErr.message.includes("provider") || sbErr.message.includes("Invalid parameter")) {
        setError("SMS is not set up yet. Please use Email sign-in above instead — it works right now!");
      } else {
        setError(sbErr.message);
      }
      return;
    }
    setStep("otp"); setCountdown(60);
  }

  function handleOtpChange(i, val) {
    if (val.length > 1) {
      const digits = val.replace(/\D/g,"").slice(0,6).split("");
      const n = [...otp]; digits.forEach((d,j) => { if(j<6) n[j]=d; });
      setOtp(n);
      const next = n.findIndex(v=>!v); document.getElementById(`otp-${next===-1?5:next}`)?.focus(); return;
    }
    const d = val.replace(/\D/g,"").slice(-1);
    const n=[...otp]; n[i]=d; setOtp(n);
    if (d && i<5) document.getElementById(`otp-${i+1}`)?.focus();
  }

  async function verifyOTP(e) {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits."); return; }
    setLoading(true);
    const { data, error: sbErr } = await supabase.auth.verifyOtp({ phone: normalise(phone.trim()), token: code, type: "sms" });
    setLoading(false);
    if (sbErr) { setError(sbErr.message); setOtp(["","","","","",""]); document.getElementById("otp-0")?.focus(); return; }
    if (data?.user) {
      const { data: ex } = await supabase.from("profiles").select("id").eq("id",data.user.id).single();
      if (!ex) await supabase.from("profiles").insert([{ id:data.user.id, phone:normalise(phone.trim()), loyalty_points:0, loyalty_tier:"bronze", created_at:new Date().toISOString() }]);
    }
    onSuccess();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Helpful note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-700 font-medium">⚠️ Phone OTP requires Twilio setup in Supabase.</p>
        <p className="text-xs text-amber-600 mt-0.5">If you see an error, use the Email tab instead — it works right away.</p>
      </div>

      {step === "phone" ? (
        <form onSubmit={sendOTP} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm">🇰🇪</span>
              <input type="tel" value={phone} onChange={e=>{setPhone(e.target.value);setError("");}}
                placeholder="0712 345 678" autoComplete="tel"
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">We'll send a 6-digit SMS code.</p>
          </div>
          <ErrorBox msg={error}/>
          <button type="submit" disabled={loading||!phone}
            className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Sending…</> : "Send verification code →"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOTP} className="flex flex-col gap-4">
          <button type="button" onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 self-start">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Change number
          </button>
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{phone}</div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">Enter the 6-digit code</label>
            <div className="flex gap-2 justify-between">
              {otp.map((d,i) => (
                <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={6} value={d}
                  onChange={e=>handleOtpChange(i,e.target.value)} onFocus={e=>e.target.select()}
                  onKeyDown={e=>{ if(e.key==="Backspace"&&!otp[i]&&i>0) document.getElementById(`otp-${i-1}`)?.focus(); }}
                  className="w-11 h-12 text-center text-lg font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/30 focus:border-[#C8290A]"
                  autoFocus={i===0} autoComplete="one-time-code"/>
              ))}
            </div>
          </div>
          <ErrorBox msg={error}/>
          <button type="submit" disabled={loading||otp.join("").length<6}
            className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-50 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verifying…</> : "Verify & sign in"}
          </button>
          <div className="text-center">
            {countdown>0 ? <p className="text-xs text-gray-400">Resend in <span className="font-semibold">{countdown}s</span></p>
              : <button type="button" onClick={sendOTP} className="text-xs font-semibold text-[#C8290A] hover:underline">Resend code</button>}
          </div>
        </form>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN LOGIN PAGE
═══════════════════════════════════════ */
export default function Login() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const user           = useAuthStore((s) => s.user);
  const initialized    = useAuthStore((s) => s.initialized);
  const nextPath       = searchParams.get("next") ?? "/dashboard";
  const reason         = searchParams.get("reason"); // "checkout" etc.

  const [method,    setMethod]    = useState("email"); // "email" | "phone" | "google"
  const [googleLoad,setGoogleLoad]= useState(false);
  const [googleErr, setGoogleErr] = useState("");

  // Already signed in AND fully initialized → redirect
  useEffect(() => {
    if (user && initialized) {
      console.log("✓ User signed in, redirecting to", nextPath);
      const timer = setTimeout(() => {
        navigate(decodeURIComponent(nextPath), { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, initialized, navigate, nextPath]);

  function onSuccess() {
    // Just log success, let the useEffect handle redirect
    console.log("✓ Sign-in successful, waiting for auth state...");
  }

  async function handleGoogle() {
    setGoogleLoad(true); setGoogleErr("");
    const { error: sbErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (sbErr) {
      if (sbErr.message.includes("not enabled") || sbErr.message.includes("provider")) {
        setGoogleErr("Google sign-in is not enabled yet. Enable it in Supabase → Authentication → Providers → Google. Use email sign-in for now.");
      } else {
        setGoogleErr(sbErr.message);
      }
      setGoogleLoad(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Logo/>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
            Welcome to Kuku<span className="text-[#C8290A]">Mart</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            {reason === "checkout"
              ? "Sign in to complete your order and track it."
              : "Sign in to track orders and earn loyalty rewards."}
          </p>
        </div>

        {/* Checkout context banner */}
        {reason === "checkout" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-2.5">
            <span className="text-base shrink-0">🛒</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">Almost there!</p>
              <p className="text-xs text-blue-700 mt-0.5">Sign in or create a free account to complete your order. Your cart is saved.</p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

          {/* Method tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
            {[
              { id:"email",  label:"📧 Email" },
              { id:"phone",  label:"📱 Phone" },
              { id:"google", label:"🌐 Google" },
            ].map(m => (
              <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  method===m.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Email form */}
          {method === "email" && <EmailForm onSuccess={onSuccess}/>}

          {/* Phone form */}
          {method === "phone" && <PhoneForm onSuccess={onSuccess}/>}

          {/* Google */}
          {method === "google" && (
            <div className="flex flex-col gap-4">
              {googleErr ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Google sign-in not configured</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{googleErr}</p>
                  <button type="button" onClick={() => setMethod("email")}
                    className="mt-3 w-full py-2 text-xs font-semibold bg-[#C8290A] text-white rounded-xl hover:bg-[#a82008] transition-colors">
                    Use email instead →
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 text-center">Sign in with your Google account — fast and secure.</p>
                  <button type="button" onClick={handleGoogle} disabled={googleLoad}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-semibold text-sm py-3.5 rounded-xl transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {googleLoad ? "Redirecting to Google…" : "Continue with Google"}
                  </button>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-semibold mb-1">To enable Google sign-in:</p>
                    <ol className="text-xs text-gray-500 space-y-0.5 list-decimal list-inside">
                      <li>Open Supabase → Authentication → Providers</li>
                      <li>Click Google → toggle to enabled</li>
                      <li>Add your Google Client ID & Secret</li>
                      <li>Done! Google login will work.</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom links */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-400">
          <Link to="/" className="hover:text-[#C8290A] transition-colors">← Back to shop</Link>
          <span>·</span>
          <Link to="/contact" className="hover:text-[#C8290A] transition-colors">Need help?</Link>
        </div>
      </div>
    </div>
  );
}