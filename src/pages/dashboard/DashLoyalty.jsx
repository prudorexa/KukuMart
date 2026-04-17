// src/pages/dashboard/DashLoyalty.jsx
// FIXES:
//  ✅ All Supabase queries wrapped in try/catch
//  ✅ Works even if loyalty_history table doesn't exist yet
//  ✅ Redeem flow gracefully handles missing table

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";

const TIERS = [
  { key:"bronze",   label:"Bronze",   min:0,    max:199,  color:"bg-orange-100 text-orange-800", icon:"🥉" },
  { key:"silver",   label:"Silver",   min:200,  max:499,  color:"bg-gray-100 text-gray-700",      icon:"🥈" },
  { key:"gold",     label:"Gold",     min:500,  max:999,  color:"bg-amber-100 text-amber-800",    icon:"🥇" },
  { key:"platinum", label:"Platinum", min:1000, max:99999,color:"bg-purple-100 text-purple-800",  icon:"💎" },
];

const EARN_RULES = [
  { icon:"🛒", label:"Every KSh 100 spent",  pts:"+10 pts" },
  { icon:"⭐", label:"Leaving a review",      pts:"+20 pts" },
  { icon:"👥", label:"Referring a friend",    pts:"+50 pts" },
  { icon:"🎂", label:"Birthday bonus",        pts:"+100 pts" },
  { icon:"📦", label:"First order ever",      pts:"+30 pts" },
];

const REWARDS = [
  { id:"disc50",    label:"KSh 50 off",         desc:"Discount on next order",     cost:50,  icon:"🏷️" },
  { id:"freedel",   label:"Free delivery",       desc:"Any zone, one order",        cost:100, icon:"🛵" },
  { id:"freepiece", label:"Free fried piece",    desc:"Added to your next order",   cost:200, icon:"🍗" },
  { id:"disc200",   label:"KSh 200 off",         desc:"On orders over KSh 1,000",   cost:300, icon:"💰" },
  { id:"wholefree", label:"Free whole chicken",  desc:"On orders over KSh 2,000",   cost:600, icon:"🐔" },
];

export default function DashLoyalty() {
  const user         = useAuthStore((s) => s.user);
  const profile      = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [history,   setHistory]   = useState([]);
  const [histError, setHistError] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [toast,     setToast]     = useState(null);

  const points = profile?.loyalty_points ?? 0;
  const tier   = [...TIERS].reverse().find(t => points >= t.min) ?? TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(tier) + 1] ?? null;
  const progress = nextTier
    ? Math.min(100, Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user?.id]);

  async function loadHistory() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("loyalty_history")
        .select("id, points, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data ?? []);
    } catch {
      // Table might not exist yet — show a friendly note instead of crashing
      setHistError(true);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleRedeem(reward) {
    if (points < reward.cost) return;
    setRedeeming(reward.id);

    try {
      // 1. Deduct points from profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ loyalty_points: points - reward.cost })
        .eq("id", user.id);

      if (profileErr) throw profileErr;

      // 2. Try to log to loyalty_history (silently skip if table missing)
      try {
        await supabase.from("loyalty_history").insert([{
          user_id:     user.id,
          points:      -reward.cost,
          description: `Redeemed: ${reward.label}`,
          created_at:  new Date().toISOString(),
        }]);
        await loadHistory();
      } catch {
        // loyalty_history table not created yet — that's fine
      }

      // 3. Refresh profile in store
      await fetchProfile(user.id);
      showToast(`🎉 "${reward.label}" redeemed! We'll apply it to your next order.`);
    } catch (err) {
      showToast(err.message ?? "Failed to redeem. Please try again.", "error");
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className={`rounded-2xl p-4 text-sm font-medium border ${
          toast.type === "error"
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-green-50 border-green-200 text-green-800"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Points balance card */}
      <div className="bg-[#C8290A] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none select-none">⭐</div>

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div>
            <p className="text-red-200 text-xs font-medium mb-1">Your balance</p>
            <p className="text-4xl font-bold">{points.toLocaleString()}</p>
            <p className="text-red-200 text-sm mt-0.5">loyalty points</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${tier.color}`}>
            {tier.icon} {tier.label}
          </span>
        </div>

        {nextTier ? (
          <div className="relative z-10">
            <div className="flex justify-between text-xs text-red-200 mb-1.5">
              <span>{tier.label} member</span>
              <span>{nextTier.min - points} pts to {nextTier.label}</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width:`${progress}%` }}/>
            </div>
          </div>
        ) : (
          <p className="text-red-200 text-xs relative z-10">🏆 You've reached Platinum — the highest tier!</p>
        )}
      </div>

      {/* Tier overview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Membership tiers</p>
        <div className="grid grid-cols-4 gap-2">
          {TIERS.map(t => (
            <div key={t.key} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border ${
              tier.key === t.key ? "border-[#C8290A] bg-red-50" : "border-gray-100 bg-gray-50"
            }`}>
              <span className="text-xl">{t.icon}</span>
              <p className={`text-[10px] font-bold ${tier.key === t.key ? "text-[#C8290A]" : "text-gray-500"}`}>{t.label}</p>
              <p className="text-[9px] text-gray-400">{t.min === 0 ? "0+" : `${t.min}+`} pts</p>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem rewards */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Redeem rewards</p>
        <div className="flex flex-col gap-2.5">
          {REWARDS.map(reward => {
            const canAfford = points >= reward.cost;
            const isRedeeming = redeeming === reward.id;
            return (
              <div key={reward.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all ${
                canAfford ? "border-gray-200 hover:border-gray-300" : "border-gray-100 opacity-60"
              }`}>
                <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0 border border-gray-100">
                  {reward.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{reward.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{reward.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-[#C8290A]">{reward.cost} pts</span>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || isRedeeming}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors min-w-72px text-center ${
                      canAfford
                        ? "bg-[#C8290A] text-white hover:bg-[#a82008]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isRedeeming ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin inline-block"/>
                      </span>
                    ) : canAfford ? "Redeem" : `Need ${reward.cost - points} more`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to earn */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How to earn points</p>
        <div className="flex flex-col gap-3">
          {EARN_RULES.map(r => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="text-base w-6 shrink-0 text-center">{r.icon}</span>
              <p className="flex-1 text-sm text-gray-700">{r.label}</p>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">{r.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Points history */}
      {!loading && !histError && history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 border-b border-gray-100">
            Recent activity
          </p>
          <div className="divide-y divide-gray-50">
            {history.map((h, i) => (
              <div key={h.id ?? i} className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-gray-700 flex-1 mr-3">{h.description}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold ${h.points > 0 ? "text-green-600" : "text-red-500"}`}>
                    {h.points > 0 ? "+" : ""}{h.points} pts
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(h.created_at).toLocaleDateString("en-KE", { day:"numeric", month:"short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If loyalty_history table doesn't exist yet */}
      {histError && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-gray-500 mb-1">Points history not available yet</p>
          <p className="text-xs text-gray-400">Run the SQL setup in your Profile tab to enable this.</p>
        </div>
      )}

    </div>
  );
}