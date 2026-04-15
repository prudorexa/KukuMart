// src/pages/dashboard/DashProfile.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, selectInitial } from "../../store/authStore";

export default function DashProfile() {
  const user          = useAuthStore((s) => s.user);
  const profile       = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut       = useAuthStore((s) => s.signOut);
  const initial       = useAuthStore(selectInitial);
  const navigate      = useNavigate();

  const [name,    setName]    = useState(profile?.full_name ?? "");
  const [phone,   setPhone]   = useState(profile?.phone ?? user?.phone ?? "");
  const [area,    setArea]    = useState(profile?.default_area ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const [notifs, setNotifs] = useState({
    order_updates:    profile?.notif_order_updates  ?? true,
    loyalty_alerts:   profile?.notif_loyalty_alerts ?? true,
    promotions:       profile?.notif_promotions     ?? false,
  });

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const { error: err } = await updateProfile({
      full_name:    name.trim(),
      phone:        phone.trim(),
      default_area: area.trim(),
      notif_order_updates:  notifs.order_updates,
      notif_loyalty_alerts: notifs.loyalty_alerts,
      notif_promotions:     notifs.promotions,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  function ToggleSwitch({ checked, onChange }) {
    return (
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-[#C8290A]" : "bg-gray-300"}`}
        role="switch" aria-checked={checked}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-18px" : "translate-x-0.5"}`} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar + name hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#C8290A] flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{profile?.full_name || "My account"}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user?.phone ?? user?.email ?? ""}</p>
          <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800`}>
            🥇 {(profile?.loyalty_tier ?? "bronze").charAt(0).toUpperCase()+(profile?.loyalty_tier??"bronze").slice(1)} member
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">Personal details</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)}
              placeholder="e.g. Jane Wanjiru" autoComplete="name"
              className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone number</label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
              placeholder="0712 345 678" autoComplete="tel"
              className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Default delivery area</label>
            <input type="text" value={area} onChange={e=>setArea(e.target.value)}
              placeholder="e.g. Westlands, Nairobi"
              className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"/>
            <p className="text-xs text-gray-400 mt-1.5">Pre-fills your delivery address at checkout</p>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

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
        <p className="text-sm font-bold text-gray-900 mb-4">Notifications</p>
        <div className="flex flex-col gap-4">
          {[
            { key:"order_updates",  label:"Order status updates",  desc:"SMS when your order status changes" },
            { key:"loyalty_alerts", label:"Loyalty point alerts",   desc:"Notify when you earn or redeem points" },
            { key:"promotions",     label:"Promotions & offers",    desc:"Special deals and new products" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ToggleSwitch
                checked={notifs[key]}
                onChange={val => setNotifs(prev => ({ ...prev, [key]: val }))}
              />
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-4 text-xs font-semibold text-[#C8290A] hover:underline">
          Save notification preferences
        </button>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-3">Account</p>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Member since</span>
            <span className="text-sm font-medium text-gray-900">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-KE",{month:"long",year:"numeric"}) : "—"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Loyalty tier</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{profile?.loyalty_tier ?? "Bronze"}</span>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Sign out</p>
            <p className="text-xs text-gray-500 mt-0.5">You'll need to sign in again to view your dashboard</p>
          </div>
          <button onClick={handleSignOut}
            className="text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}