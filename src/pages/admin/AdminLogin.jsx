// src/pages/admin/AdminLogin.jsx
// Simple password-gate for the admin panel.
// The password is stored in .env as VITE_ADMIN_PASSWORD
// For production use Supabase Auth instead.

import { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "kukumart2024";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Small artificial delay so it doesn't feel instant
    await new Promise((r) => setTimeout(r, 600));
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("kuku_admin", "1");
      onLogin();
    } else {
      setError("Incorrect password. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#C8290A] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <ellipse cx="20" cy="27" rx="10" ry="11" fill="white" />
              <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white" />
              <ellipse cx="16.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130" />
              <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130" />
              <ellipse cx="23.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130" />
              <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130" />
              <circle cx="24" cy="12.5" r="1.7" fill="#C8290A" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">
            Kuku<span className="text-[#C8290A]">Mart</span> Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your store</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Admin password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8290A]/40 focus:border-[#C8290A] transition-all"
            />
            {error && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-700 mt-6">
          Set password via{" "}
          <code className="bg-gray-900 px-1.5 py-0.5 rounded text-gray-500">
            VITE_ADMIN_PASSWORD
          </code>{" "}
          in your .env file
        </p>
      </div>
    </div>
  );
}