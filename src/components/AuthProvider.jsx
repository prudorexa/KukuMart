// src/components/AuthProvider.jsx
// FIX: React StrictMode double-invokes effects in development.
// We use a ref so init() is only ever called once per app lifecycle.

import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";

export default function AuthProvider({ children }) {
  const init     = useAuthStore((s) => s.init);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return; // StrictMode guard
    calledRef.current = true;
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return children;
}