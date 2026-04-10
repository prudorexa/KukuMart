// src/pages/admin/AdminOrders.jsx
// Full orders management tab — view all orders, filter by status,
// update status, see order details in a modal.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

/* ── Constants ── */
const STATUS_OPTIONS = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

const STATUS_STYLES = {
  pending:          { bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500",  label: "Pending" },
  confirmed:        { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500",   label: "Confirmed" },
  preparing:        { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500", label: "Preparing" },
  out_for_delivery: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", label: "Out for delivery" },
  delivered:        { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500",  label: "Delivered" },
  cancelled:        { bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-400",    label: "Cancelled" },
};

const PAYMENT_LABELS = { mpesa: "M-Pesa", card: "Card", cash: "Cash on delivery" };
const CAT_EMOJI = { broiler_live:"🐓", kienyeji_live:"🐔", slaughtered:"🥩", fried_pieces:"🍗", fried_whole:"🍖" };

/* ── Status badge ── */
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ── Order detail modal ── */
function OrderModal({ order, onClose, onStatusChange }) {
  const [status, setStatus]   = useState(order.status);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  async function saveStatus() {
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      onStatusChange(order.id, status);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(order.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Customer",  value: order.customer_name },
              { label: "Phone",     value: order.phone },
              { label: "Location",  value: order.location,      full: true },
              { label: "Zone",      value: order.delivery_zone ?? "—" },
              { label: "Payment",   value: PAYMENT_LABELS[order.payment_type] ?? order.payment_type },
              { label: "Paid",      value: order.paid ? "✅ Yes" : "❌ No" },
            ].map(({ label, value, full }) => (
              <div key={label} className={`bg-gray-50 rounded-xl p-3 ${full ? "col-span-2" : ""}`}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900 break-all">{value ?? "—"}</p>
              </div>
            ))}
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                Items ordered
              </p>
              <div className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-lg">{CAT_EMOJI[item.category] ?? "🐔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">📝 Customer notes</p>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">KSh {order.subtotal?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className="font-medium">KSh {order.delivery_fee?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1.5">
              <span className="text-gray-900">Total</span>
              <span className="text-[#C8290A]">KSh {order.total?.toLocaleString() ?? "—"}</span>
            </div>
          </div>

          {/* Status update */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Update status</label>
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_STYLES[s]?.label ?? s}</option>
                ))}
              </select>
              <button
                onClick={saveStatus}
                disabled={saving || status === order.status}
                className="px-4 py-2.5 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                ) : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Orders tab ── */
export default function AdminOrders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search,       setSearch]       = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error } = await query;
    if (!error) setOrders(data ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleStatusChange(id, newStatus) {
    setOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, status: newStatus } : o)
    );
  }

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.customer_name?.toLowerCase().includes(q) ||
      o.phone?.includes(q) ||
      o.id.slice(0, 8).toLowerCase().includes(q)
    );
  });

  // Stats bar
  const stats = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: "pending",          label: "Pending",      color: "text-amber-600" },
          { key: "confirmed",        label: "Confirmed",    color: "text-blue-600" },
          { key: "preparing",        label: "Preparing",    color: "text-purple-600" },
          { key: "out_for_delivery", label: "Out",          color: "text-orange-600" },
          { key: "delivered",        label: "Delivered",    color: "text-green-600" },
          { key: "cancelled",        label: "Cancelled",    color: "text-red-500" },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
            className={`bg-white border rounded-xl p-3 text-left transition-all ${
              filterStatus === key ? "border-[#C8290A] bg-red-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <p className={`text-xl font-bold ${color}`}>{stats[key] ?? 0}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, phone or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A]"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_STYLES[s]?.label}</option>
            ))}
          </select>
          <button
            onClick={fetchOrders}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors bg-white"
            title="Refresh"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading orders…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-sm font-semibold text-gray-700">No orders found</p>
            <p className="text-xs text-gray-400">
              {filterStatus !== "all" || search ? "Try clearing your filters." : "Orders will appear here once customers start buying."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-640px">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Order ID", "Customer", "Items", "Total", "Payment", "Status", "Date", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 font-semibold">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 whitespace-nowrap">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        KSh {order.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {PAYMENT_LABELS[order.payment_type] ?? order.payment_type}
                        {order.paid && <span className="ml-1 text-green-600 text-xs">✓</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs font-semibold text-[#C8290A] hover:underline whitespace-nowrap"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}