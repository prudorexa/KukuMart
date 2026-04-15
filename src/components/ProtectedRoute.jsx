// src/components/ProtectedRoute.jsx
// Wrap any route that requires the user to be signed in.
//
// Usage in App.jsx:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//
// If the user isn't signed in → redirects to /login?next=/dashboard
// While checking session → shows a full-screen spinner
// Once signed in → renders children normally

import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const loading     = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const user        = useAuthStore((s) => s.user);
  const location    = useLocation();

  // Still bootstrapping — show a minimal spinner
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-[#C8290A] rounded-2xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <ellipse cx="20" cy="27" rx="10" ry="11" fill="white" />
              <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white" />
              <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130" />
              <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130" />
              <circle cx="24" cy="12.5" r="1.7" fill="#C8290A" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not signed in → redirect preserving the intended destination
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}