// src/components/AuthProvider.jsx
// Drop <AuthProvider> at the top of your component tree (inside BrowserRouter).
// It calls authStore.init() exactly once, which bootstraps the Supabase session
// and sets up the onAuthStateChange listener.
//
// This is a thin wrapper — it renders nothing visual, just initialises auth.

import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export default function AuthProvider({ children }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const cleanup = init();
    return cleanup; // unsubscribes the Supabase listener on unmount
  }, [init]);

  return children;
}