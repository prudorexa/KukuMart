// src/pages/dashboard/DashOverview.jsx
// FIXES:
//  ✅ Every Supabase query wrapped in try/catch — page loads even if tables are missing
//  ✅ Works for email-only users (no phone number)
//  ✅ Handles empty states gracefully

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";

const STATUS_COLOR = {
  pending:          "bg-amber-100 text-amber-800",
  confirmed:        "bg-blue-100 text-blue-800",
  preparing:        "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered:        "bg-green-100 text-green-700",
  cancelled:        "bg-red-100 text-red-700",
};
const STATUS_LABEL = {
  pending:"Order received", confirmed:"Confirmed", preparing:"Being prepared",
  out_for_delivery:"Out for delivery 🛵", delivered:"Delivered ✓", cancelled:"Cancelled",
};
const STAGE_PROGRESS = {
  pending:20, confirmed:40, preparing:60, out_for_delivery:80, delivered:100, cancelled:0,
};
const CAT_EMOJI = {
  broiler_live:"🐓", kienyeji_live:"🐔", slaughtered:"🥩", fried_pieces:"🍗", fried_whole:"🍖",
};

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${color}`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function DashOverview({ onTabChange }) {
  const user      = useAuthStore((s) => s.user);
  const profile   = useAuthStore((s) => s.profile);
  const navigate  = useNavigate();
  const addItem   = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [stats,          setStats]          = useState({ total:0, spent:0, points:0 });
  const [activeOrders,   setActiveOrders]   = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState("");

  useEffect(() => {
    if (!user?.id) {
      console.log("No user or user.id, skipping load");
      setLoading(false);
      return;
    }
    console.log("DashOverview: user loaded, fetching data for", user.id);
    load();
  }, [user?.id]);

  async function load() {
    setLoading(true);
    setLoadError("");

    // Safety timeout - force stop after 10 seconds
    const timeoutId = setTimeout(() => {
      console.error("❌ Dashboard data fetch timeout!");
      setLoadError("Data loading timeout. Please refresh the page.");
      setLoading(false);
    }, 10000);

    try {
      console.log("📊 Loading dashboard data for user:", user.id);
      
      // Simplified: just fetch by user_id for now
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, status, items, created_at, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (ordersError) {
        console.error("Orders query error:", ordersError);
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }
      console.log(`✓ Fetched ${orders?.length ?? 0} orders`);

      const all = orders ?? [];
      const active = all.filter(o => !["delivered","cancelled"].includes(o.status));
      const delivered = all.filter(o => o.status === "delivered");
      const totalSpent = all.filter(o => o.status !== "cancelled").reduce((s,o) => s+(o.total??0), 0);

      // Try to fetch reviews, but don't fail if table doesn't exist
      let needsReview = [];
      try {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("order_id")
          .eq("user_id", user.id);
        const reviewedIds = new Set((reviews ?? []).map(r => r.order_id));
        needsReview = delivered.filter(o => !reviewedIds.has(o.id)).slice(0, 3);
      } catch (err) {
        console.log("Reviews fetch skipped:", err.message);
        needsReview = delivered.slice(0, 3);
      }

      setStats({
        total: all.length,
        spent: totalSpent,
        points: profile?.loyalty_points ?? 0,
      });
      setActiveOrders(active.slice(0, 3));
      setPendingReviews(needsReview);
      console.log(`✓ Dashboard loaded: ${all.length} orders, ${active.length} active`);
      clearTimeout(timeoutId);

    } catch (err) {
      console.error("❌ Dashboard error:", err);
      setLoadError("Could not load your data. Check your internet connection and try again.");
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  }

  function handleReorder(order) {
    clearCart();
    (Array.isArray(order.items) ? order.items : []).forEach(item => addItem(item));
    navigate("/cart");
  }

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const firstName = (profile?.full_name || user?.email?.split("@")[0] || "there").split(" ")[0];

  // ── Loading skeleton ──
  if (loading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-2xl"/>
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"/>)}
      </div>
      <div className="h-40 bg-gray-100 rounded-2xl"/>
    </div>
  );

  // ── Error state ──
  if (loadError) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">⚠️</div>
      <p className="text-sm font-bold text-red-800 mb-1">Could not load dashboard</p>
      <p className="text-xs text-red-600 mb-4">{loadError}</p>
      <button onClick={load} className="px-4 py-2 bg-[#C8290A] text-white text-sm font-semibold rounded-xl hover:bg-[#a82008] transition-colors">
        Try again
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">

      {/* Welcome banner */}
      <div className="bg-[#C8290A] rounded-2xl px-6 py-5 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-10 pointer-events-none select-none">🐔</div>
        <p className="text-red-200 text-xs font-medium mb-0.5 relative z-10">{greeting}</p>
        <h2 className="text-white text-xl font-bold relative z-10">{firstName} 👋</h2>
        <p className="text-red-200 text-xs mt-1 relative z-10">
          {stats.total > 0
            ? `You've made ${stats.total} order${stats.total!==1?"s":""} with KukuMart. Thank you!`
            : "Welcome! Browse the shop and place your first order."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total orders" value={stats.total} icon="📋" color="bg-blue-50"/>
        <StatCard label="Total spent"  value={`KSh ${stats.spent.toLocaleString()}`} icon="💰" color="bg-green-50"/>
        <StatCard label="Loyalty pts"  value={stats.points.toLocaleString()} icon="⭐" color="bg-amber-50"/>
      </div>

      {/* Active orders */}
      {activeOrders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active orders</p>
            <button onClick={() => onTabChange("orders")} className="text-xs font-semibold text-[#C8290A] hover:underline">View all</button>
          </div>
          <div className="divide-y divide-gray-50">
            {activeOrders.map(order => (
              <div key={order.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-mono font-bold text-gray-600">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">KSh {order.total?.toLocaleString("en") || "0"}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8290A] rounded-full transition-all duration-700"
                    style={{ width:`${STAGE_PROGRESS[order.status]??20}%` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick actions</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label:"Browse shop",  icon:"🛒",  action: () => navigate("/shop") },
            { label:"Track order",  icon:"🛵",  action: () => navigate("/orders") },
            { label:"My reviews",   icon:"⭐",  action: () => onTabChange("reviews") },
            { label:"Loyalty pts",  icon:"🎁",  action: () => onTabChange("loyalty") },
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action}
              className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-[#C8290A]/20 rounded-xl text-sm font-medium text-gray-700 hover:text-[#C8290A] transition-all text-left">
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
              const first = items[0];
              return (
                <div key={order.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                  <span className="text-lg">{CAT_EMOJI[first?.category] ?? "🐔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {first?.name ?? "Order"}{items.length>1 ? ` +${items.length-1} more` : ""}
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

      {/* First time — no orders yet */}
      {stats.total === 0 && !loading && (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🐔</div>
          <p className="text-sm font-bold text-gray-900 mb-1">No orders yet</p>
          <p className="text-xs text-gray-500 mb-4">Browse our fresh chicken and place your first order!</p>
          <button onClick={() => navigate("/shop")}
            className="inline-flex items-center gap-2 bg-[#C8290A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#a82008] transition-colors">
            Shop now →
          </button>
        </div>
      )}
    </div>
  );
}