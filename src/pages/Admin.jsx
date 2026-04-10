// src/pages/Admin.jsx
// Entry point for the admin panel.
// - Guards behind a password login (session-based)
// - Shows a dashboard overview with live stats
// - Tabbed interface: Orders | Products

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AdminLogin    from "./admin/AdminLogin";
import AdminOrders   from "./admin/AdminOrders";
import AdminProducts from "./admin/AdminProducts";

/* ── Stat card ── */
function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Dashboard stats (top of admin) ── */
function DashboardStats() {
  const [stats, setStats] = useState({
    totalOrders: 0, todayOrders: 0, pendingOrders: 0,
    totalRevenue: 0, totalProducts: 0, outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id, total, status, created_at"),
        supabase.from("products").select("id, in_stock"),
      ]);

      const orders   = ordersRes.data   ?? [];
      const products = productsRes.data ?? [];

      setStats({
        totalOrders:   orders.length,
        todayOrders:   orders.filter((o) => new Date(o.created_at) >= today).length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        totalRevenue:  orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total ?? 0), 0),
        totalProducts: products.length,
        outOfStock:    products.filter((p) => !p.in_stock).length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
            <div className="h-6 bg-gray-100 rounded w-16 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <StatCard label="Total orders"    value={stats.totalOrders}                                               icon="📋" color="bg-blue-50" />
      <StatCard label="Today's orders"  value={stats.todayOrders}                                               icon="⚡" color="bg-amber-50" />
      <StatCard label="Pending"         value={stats.pendingOrders}  sub="Need attention"                       icon="⏳" color="bg-orange-50" />
      <StatCard label="Total revenue"   value={`KSh ${stats.totalRevenue.toLocaleString()}`}                    icon="💰" color="bg-green-50" />
      <StatCard label="Products"        value={stats.totalProducts}                                              icon="🐔" color="bg-purple-50" />
      <StatCard label="Out of stock"    value={stats.outOfStock}     sub={stats.outOfStock > 0 ? "Update soon" : "All good ✓"} icon="📦" color="bg-red-50" />
    </div>
  );
}

/* ── Tab navigation ── */
const TABS = [
  {
    id: "orders",
    label: "Orders",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "products",
    label: "Products",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
];

/* ── Main Admin component ── */
export default function Admin() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("kuku_admin") === "1"
  );
  const [activeTab, setActiveTab] = useState("orders");

  function handleLogout() {
    sessionStorage.removeItem("kuku_admin");
    setAuthed(false);
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header bar */}
      <div className="w-full bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-7 h-7 bg-[#C8290A] rounded-lg flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                <ellipse cx="20" cy="27" rx="10" ry="11" fill="white" />
                <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white" />
                <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130" />
                <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130" />
                <circle cx="24" cy="12.5" r="1.7" fill="#C8290A" />
              </svg>
            </div>
            <span className="text-white text-sm font-bold">
              Kuku<span className="text-[#C8290A]">Mart</span>
              <span className="text-gray-500 font-normal ml-2">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View site
            </a>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome + date */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Good{new Date().getHours() < 12 ? " morning" : new Date().getHours() < 17 ? " afternoon" : " evening"} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <DashboardStats />

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[#C8290A] text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "orders"   && <AdminOrders />}
        {activeTab === "products" && <AdminProducts />}
      </div>
    </div>
  );
}