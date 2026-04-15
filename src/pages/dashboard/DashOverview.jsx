// src/pages/dashboard/DashOverview.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const ORDER_STAGE_LABEL = {
  pending: "Order received", confirmed: "Confirmed",
  preparing: "Being prepared", out_for_delivery: "Out for delivery 🛵",
  delivered: "Delivered ✓", cancelled: "Cancelled",
};
const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-800", confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800", out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
};
const STAGE_PROGRESS = {
  pending: 20, confirmed: 40, preparing: 60, out_for_delivery: 80, delivered: 100, cancelled: 0,
};
const CAT_EMOJI = {
  broiler_live:"🐓", kienyeji_live:"🐔", slaughtered:"🥩", fried_pieces:"🍗", fried_whole:"🍖",
};

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashOverview({ onTabChange }) {
  const user    = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const addItem  = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [stats,         setStats]         = useState(null);
  const [activeOrders,  setActiveOrders]  = useState([]);
  const [pendingReviews,setPendingReviews] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const phone = user.phone ?? profile?.phone ?? "";
      const variants = [];
      if (phone) {
        const p = phone.replace(/[\s-]/g,"");
        variants.push(p);
        if (p.startsWith("+254")) variants.push("0"+p.slice(4), "254"+p.slice(1));
        else if (p.startsWith("254")) variants.push("+"+p, "0"+p.slice(3));
        else if (p.startsWith("0")) variants.push("254"+p.slice(1), "+254"+p.slice(1));
      }

      const queries = [];
      if (variants.length) queries.push(supabase.from("orders").select("*").in("phone", variants).order("created_at", { ascending: false }));
      if (user.id) queries.push(supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }));

      const results = await Promise.all(queries);
      const seen = new Set();
      const all = results.flatMap(r => r.data ?? []).filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });
      all.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));

      const active = all.filter(o => !["delivered","cancelled"].includes(o.status));
      const delivered = all.filter(o => o.status === "delivered");
      const totalSpent = all.filter(o => o.status !== "cancelled").reduce((s,o) => s+(o.total??0),0);

      // Pending reviews = delivered orders that haven't been reviewed yet
      const { data: reviewed } = await supabase.from("reviews").select("order_id").eq("user_id", user.id);
      const reviewedIds = new Set((reviewed??[]).map(r=>r.order_id));
      const needsReview = delivered.filter(o => !reviewedIds.has(o.id)).slice(0,3);

      setStats({ total: all.length, spent: totalSpent, points: profile?.loyalty_points ?? 0 });
      setActiveOrders(active.slice(0,3));
      setPendingReviews(needsReview);
      setLoading(false);
    }
    load();
  }, [user, profile]);

  function handleReorder(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    clearCart();
    items.forEach(item => addItem(item));
    navigate("/cart");
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = profile?.full_name || user?.phone || "there";
  const firstName = displayName.split(" ")[0];

  if (loading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><div key={i} className="h-24 bg-gray-100 rounded-2xl"/>)}</div>
      <div className="h-40 bg-gray-100 rounded-2xl" />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome banner */}
      <div className="bg-[#C8290A] rounded-2xl px-6 py-5 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-red-200 text-xs font-medium mb-0.5">{greeting()}</p>
          <h2 className="text-white text-xl font-bold">{firstName} 👋</h2>
          <p className="text-red-200 text-xs mt-1">
            {stats?.total > 0 ? `You've made ${stats.total} order${stats.total!==1?"s":""} with us. Thank you!` : "Welcome! Your first order awaits."}
          </p>
        </div>
        <div className="text-5xl opacity-20 absolute right-5">🐔</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total orders" value={stats?.total ?? 0} icon="📋" color="bg-blue-50" />
        <StatCard label="Total spent" value={`KSh ${(stats?.spent??0).toLocaleString()}`} icon="💰" color="bg-green-50" />
        <StatCard label="Loyalty pts" value={stats?.points ?? 0} icon="⭐" color="bg-amber-50" />
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active orders</p>
            <button onClick={() => onTabChange("orders")} className="text-xs font-semibold text-[#C8290A] hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50">
            {activeOrders.map(order => {
              const progress = STAGE_PROGRESS[order.status] ?? 0;
              return (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-mono font-bold text-gray-600">#{order.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">KSh {order.total?.toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[order.status]}`}>
                      {ORDER_STAGE_LABEL[order.status]}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C8290A] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Browse shop", icon: "🛒", to: "/shop" },
            { label: "Track order", icon: "🛵", to: "/orders" },
            { label: "My reviews", icon: "⭐", tab: "reviews" },
            { label: "Loyalty", icon: "🎁", tab: "loyalty" },
          ].map(({ label, icon, to, tab }) => (
            <button key={label}
              onClick={() => tab ? onTabChange(tab) : navigate(to)}
              className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-[#C8290A]/20 rounded-xl text-sm font-medium text-gray-700 hover:text-[#C8290A] transition-all duration-150 text-left"
            >
              <span className="text-base">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending reviews nudge */}
      {pendingReviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⭐</span>
            <p className="text-sm font-bold text-amber-800">
              {pendingReviews.length} order{pendingReviews.length!==1?"s":""} waiting for your review
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {pendingReviews.map(order => {
              const items = Array.isArray(order.items) ? order.items : [];
              const firstItem = items[0];
              return (
                <div key={order.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                  <span className="text-lg">{CAT_EMOJI[firstItem?.category] ?? "🐔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {firstItem?.name ?? "Order"}{items.length > 1 ? ` +${items.length-1} more` : ""}
                    </p>
                    <p className="text-xs text-gray-400">#{order.id.slice(0,8).toUpperCase()}</p>
                  </div>
                  <button onClick={() => onTabChange("reviews")}
                    className="shrink-0 text-xs font-semibold bg-[#C8290A] text-white px-3 py-1.5 rounded-lg hover:bg-[#a82008] transition-colors">
                    Rate
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-amber-600 mt-2">+20 loyalty points for each review!</p>
        </div>
      )}
    </div>
  );
}