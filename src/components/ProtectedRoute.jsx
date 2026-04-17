// src/components/ProtectedRoute.jsx
// FIX: Added a 3-second timeout fallback — if auth never initializes
// (e.g. network issue), we fall back gracefully instead of spinning forever.

import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const loading     = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const user        = useAuthStore((s) => s.user);
  const location    = useLocation();

  // Fallback: if still loading after 5 seconds, allow through or reject
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading && initialized) {
      console.log("🔐 ProtectedRoute: Auth loaded normally");
      return; // resolved normally
    }
    const t = setTimeout(() => {
      console.log("🔐 ProtectedRoute: Timeout! Forcing decision. user=", user?.id, "init=", initialized);
      setTimedOut(true);
    }, 5000);
    return () => clearTimeout(t);
  }, [loading, initialized, user?.id]);

  const stillWaiting = (loading || !initialized) && !timedOut;

  if (stillWaiting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-[#C8290A] rounded-2xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <ellipse cx="20" cy="27" rx="10" ry="11" fill="white"/>
              <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white"/>
              <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130"/>
              <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130"/>
              <circle cx="24" cy="12.5" r="1.7" fill="#C8290A"/>
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin"/>
          <p className="text-xs text-gray-400 mt-1">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("🔐 ProtectedRoute: No user, redirecting to login");
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  console.log("🔐 ProtectedRoute: Authenticated, showing content");
  return children;
}