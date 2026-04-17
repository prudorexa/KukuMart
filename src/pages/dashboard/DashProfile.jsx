// src/pages/dashboard/DashProfile.jsx
// FIXES:
//  ✅ Only saves columns that exist in the profiles table
//  ✅ Sign out uses window.location.href to avoid race condition
//  ✅ Notification prefs saved separately (only if columns exist)
//  ✅ Shows clear error messages

import { useState } from "react";
import { useAuthStore, selectInitial } from "../../store/authStore";
import { supabase } from "../../lib/supabase";

export default function DashProfile() {
  const user          = useAuthStore((s) => s.user);
  const profile       = useAuthStore((s) => s.profile);
  const fetchProfile  = useAuthStore((s) => s.fetchProfile);
  const signOut       = useAuthStore((s) => s.signOut);
  const initial       = useAuthStore(selectInitial);

  const [name,    setName]    = useState(profile?.full_name ?? "");
  const [phone,   setPhone]   = useState(profile?.phone ?? user?.phone ?? "");
  const [area,    setArea]    = useState(profile?.default_area ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  // Notification states — stored locally only until columns are added to DB
  const [notifOrders,   setNotifOrders]   = useState(profile?.notif_order_updates ?? true);
  const [notifLoyalty,  setNotifLoyalty]  = useState(profile?.notif_loyalty_alerts ?? true);
  const [notifPromos,   setNotifPromos]   = useState(profile?.notif_promotions ?? false);

  // ── Save core profile fields only (columns that definitely exist) ──
  async function handleSave(e) {
    e?.preventDefault();
    if (!user) return;
    setSaving(true); setError(""); setSaved(false);

    const payload = {
      id:           user.id,
      full_name:    name.trim() || null,
      phone:        phone.trim() || null,
      default_area: area.trim() || null,
      updated_at:   new Date().toISOString(),
    };

    // Try to save notification prefs — silently skip if columns don't exist yet
    // (run the SQL migration below to add them)
    const withNotifs = {
      ...payload,
      notif_order_updates:  notifOrders,
      notif_loyalty_alerts: notifLoyalty,
      notif_promotions:     notifPromos,
    };

    // First attempt with notification columns
    let { data, error: err } = await supabase
      .from("profiles")
      .upsert(withNotifs)
      .select()
      .single();

    // If it fails because of missing notif columns, retry without them
    if (err && (err.message.includes("notif_") || err.message.includes("column"))) {
      const retry = await supabase
        .from("profiles")
        .upsert(payload)
        .select()
        .single();
      data = retry.data;
      err  = retry.error;
    }

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (data) {
      // Update local store
      await fetchProfile(user.id);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  // ── Sign out — use window.location to avoid React Router race ──
  async function handleSignOut() {
    await signOut();
    window.location.href = "/"; // hard redirect, clears all state cleanly
  }

  function Toggle({ checked, onChange }) {
    return (
      <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-[#C8290A]" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-18px" : "translate-x-0.5"}`}/>
      </button>
    );
  }

  const tierLabel = profile?.loyalty_tier ?? "bronze";
  const tierCap   = tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1);
  const tierIcon  = { bronze:"🥉", silver:"🥈", gold:"🥇", platinum:"💎" }[tierLabel] ?? "🥉";

  return (
    <div className="flex flex-col gap-5">

      {/* Avatar + summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#C8290A] flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={initial} className="w-full h-full rounded-full object-cover"/>
            : initial}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{profile?.full_name || user?.email?.split("@")[0] || "My account"}</p>
          <p className="text-sm text-gray-500 mt-0.5 break-all">{user?.email ?? user?.phone ?? ""}</p>
          <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {tierIcon} {tierCap} member · {profile?.loyalty_points ?? 0} pts
          </span>
        </div>
      </div>

      {/* Personal details form */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">Personal details</p>
        <div className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full name</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Prudence Nyambura" autoComplete="name"
              className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone number</label>
            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }}
              placeholder="0712 345 678" autoComplete="tel"
              className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Default delivery area</label>
            <input type="text" value={area} onChange={e => { setArea(e.target.value); setError(""); }}
              placeholder="e.g. Ruai, Nairobi"
              className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
            <p className="text-xs text-gray-400 mt-1.5">Pre-fills your delivery address at checkout</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs text-red-700 font-medium mb-1">⚠️ Could not save</p>
              <p className="text-xs text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-1.5">
                Run the SQL migration in Supabase to fix this — see instructions below.
              </p>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl transition-colors">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</>
            ) : saved ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
            ) : "Save changes"}
          </button>
        </div>
      </form>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">Notification preferences</p>
        <div className="flex flex-col gap-4">
          {[
            { label:"Order status updates",  desc:"SMS/email when your order moves",  val:notifOrders,  set:setNotifOrders },
            { label:"Loyalty point alerts",   desc:"When you earn or redeem points",   val:notifLoyalty, set:setNotifLoyalty },
            { label:"Promotions & offers",    desc:"Special deals and new products",   val:notifPromos,  set:setNotifPromos },
          ].map(({ label, desc, val, set: setter }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={val} onChange={setter}/>
            </div>
          ))}
        </div>
        <button type="button" onClick={handleSave} disabled={saving}
          className="mt-4 text-xs font-semibold text-[#C8290A] hover:underline">
          Save preferences
        </button>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-3">Account info</p>
        <div className="space-y-2 text-sm">
          {[
            { label:"Email",        val: user?.email ?? "—" },
            { label:"Member since", val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-KE",{month:"long",year:"numeric"}) : "—" },
            { label:"Loyalty tier", val: `${tierIcon} ${tierCap}` },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SQL migration helper */}
      <div className="bg-gray-900 rounded-2xl p-5">
        <p className="text-xs font-bold text-white mb-2">🔧 Supabase SQL — run this once to finish setup</p>
        <p className="text-xs text-gray-400 mb-3">Paste this in Supabase → SQL Editor → Run. Fixes the "column not found" error.</p>
        <pre className="text-[10px] text-green-400 bg-black rounded-xl p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{`-- Add missing columns to profiles table
alter table profiles
  add column if not exists default_area       text,
  add column if not exists notif_order_updates  boolean default true,
  add column if not exists notif_loyalty_alerts boolean default true,
  add column if not exists notif_promotions    boolean default false,
  add column if not exists updated_at          timestamptz default now();

-- Auto-create profile when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, loyalty_points, loyalty_tier, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    0,
    'bronze',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach trigger (runs after every new signup)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Add user_id column to orders if not exists
alter table orders
  add column if not exists user_id uuid references auth.users(id);`}
        </pre>
      </div>

      {/* Sign out */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Sign out</p>
            <p className="text-xs text-gray-500 mt-0.5">You'll need to sign in again to access your dashboard</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>

    </div>
  );
}
