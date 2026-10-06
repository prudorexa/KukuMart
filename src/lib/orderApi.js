// src/lib/orderApi.js
import { supabase } from "./supabase";

/**
 * Load one order by its full id for the tracking / thank-you / rating pages.
 * Uses the secure `track_order` database function so the link in an email works
 * for anyone holding it (even signed out, or on another phone). If that function
 * hasn't been created yet, falls back to a normal query (works for the owner).
 */
export async function fetchTrackedOrder(id) {
  if (!id) return null;
  try {
    const { data, error } = await supabase.rpc("track_order", { p_id: id });
    // Only trust a real order object; anything else (null, [], etc.) falls through.
    if (!error && data && typeof data === "object" && !Array.isArray(data) && data.id) return data;
  } catch {
    /* fall through */
  }
  const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
