// src/store/authStore.js
// Global auth state powered by Supabase Auth + Zustand.
//
// Usage anywhere in the app:
//   import { useAuthStore } from "../store/authStore"
//   const { user, profile, loading } = useAuthStore()
//
// The store automatically syncs with Supabase's onAuthStateChange,
// so you never need to manually call getSession().

import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────
  user:       null,   // Supabase Auth user object (has id, phone, email, etc.)
  profile:    null,   // Row from our custom `profiles` table
  loading:    true,   // true while we're checking the initial session
  initialized: false, // true after first auth check completes

  // ── Actions ────────────────────────────────────────

  /** Called once at app start — bootstraps the session and listens for changes */
  init() {
    console.log("🔐 Auth Store: Initializing...");
    
    // Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      console.log("🔐 Auth Store: Initial session check -", user ? `User ${user.id}` : "No session");
      set({ user, loading: false });
      if (user) {
        // Fetch profile and THEN mark as initialized
        get().fetchProfile(user.id).then(() => {
          set({ initialized: true });
          console.log("🔐 Auth Store: Profile loaded, initialized = true");
        }).catch((err) => {
          console.error("🔐 Auth Store: Profile fetch failed:", err);
          set({ initialized: true }); // Initialize anyway so app doesn't hang
        });
      } else {
        set({ initialized: true });
      }
    });

    // Subscribe to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        console.log("🔐 Auth State Changed:", _event, user ? `User ${user.id}` : "No user");
        set({ user, loading: false, initialized: true });
        if (user) {
          await get().fetchProfile(user.id);
        } else {
          set({ profile: null });
        }
      }
    );

    // Return cleanup function for StrictMode
    return () => {
      console.log("🔐 Auth Store: Cleaning up subscription");
      subscription.unsubscribe();
    };
  },

  /** Fetch the user's profile from our `profiles` table */
  async fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      // If profile doesn't exist, that's fine — user will see empty profile
      // Log other errors for debugging but don't break the app
      if (error && error.code !== 'PGRST116') {
        console.warn("Profile fetch error:", error.message);
      }
      
      set({ profile: data ?? null });
      return { data, error: error && error.code !== 'PGRST116' ? error : null };
    } catch (err) {
      console.error("Profile fetch exception:", err);
      return { error: err };
    }
  },

  /** Update profile fields and refresh local state */
  async updateProfile(updates) {
    const { user } = get();
    if (!user) return { error: new Error("Not signed in") };

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (!error && data) set({ profile: data });
    return { data, error };
  },

  /** Sign out and clear state */
  async signOut() {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));

// ── Convenience selectors ───────────────────────────
export const selectUser        = (s) => s.user;
export const selectProfile     = (s) => s.profile;
export const selectIsLoggedIn  = (s) => !!s.user;
export const selectAuthLoading = (s) => s.loading;

/** Returns user's display name: profile full_name → phone → "User" */
export const selectDisplayName = (s) => {
  if (s.profile?.full_name) return s.profile.full_name;
  if (s.user?.phone)         return s.user.phone;
  if (s.user?.email)         return s.user.email?.split("@")[0];
  return "My account";
};

/** Returns first letter of display name for avatar */
export const selectInitial = (s) => {
  const name = selectDisplayName(s);
  return name.charAt(0).toUpperCase();
};