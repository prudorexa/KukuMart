// src/pages/Orders.jsx
//
// Order Tracking page — customers can:
//   1. Look up orders by phone number OR order ID
//   2. See a live animated status tracker (5 stages)
//   3. View full order details: items, delivery address, payment, totals
//   4. Re-order with one click
//   5. Auto-refreshes every 30 seconds so status updates live
//
// Supabase query: finds orders matching phone OR id prefix, newest first.

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCartStore } from "../store/cartStore";

/* ─────────────────────────────────────
   CONSTANTS
───────────────────────────────────── */
const WA_NUMBER = "254700000000"; // ← same as rest of site

const ORDER_STAGES = [
  {
    key:   "pending",
    label: "Order received",
    desc:  "We've received your order and are reviewing it.",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? "white" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key:   "confirmed",
    label: "Confirmed",
    desc:  "Your order is confirmed and payment has been verified.",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? "white" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    key:   "preparing",
    label: "Being prepared",
    desc:  "Your chicken is being freshly prepared for delivery.",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? "white" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2l1.5 15.5M21 2l-1.5 15.5M12 2v4M8 8h8M7 17h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z"/>
      </svg>
    ),
  },
  {
    key:   "out_for_delivery",
    label: "Out for delivery",
    desc:  "Your order is on its way — our rider is heading to you!",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? "white" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    key:   "delivered",
    label: "Delivered!",
    desc:  "Your order has been delivered. Enjoy your fresh chicken! 🍗",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? "white" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

// Maps ALL possible statuses to a stage index (0-4)
const STATUS_TO_STAGE = {
  pending:          0,
  confirmed:        1,
  preparing:        2,
  out_for_delivery: 3,
  delivered:        4,
  cancelled:        -1,
};

const PAYMENT_LABELS = {
  mpesa: "M-Pesa",
  card:  "Card / Bank transfer",
  cash:  "Cash on delivery",
};

const CAT_EMOJI = {
  broiler_live:  "🐓",
  kienyeji_live: "🐔",
  slaughtered:   "🥩",
  fried_pieces:  "🍗",
  fried_whole:   "🍖",
};

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("en-KE", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─────────────────────────────────────
   STATUS TRACKER COMPONENT
───────────────────────────────────── */
function StatusTracker({ status }) {
  const stageIndex = STATUS_TO_STAGE[status] ?? 0;
  const cancelled  = status === "cancelled";

  if (cancelled) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-red-800 text-base">Order cancelled</p>
          <p className="text-sm text-red-600 mt-0.5">This order has been cancelled. Please contact us if you have questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-start gap-0">
        {ORDER_STAGES.map((stage, i) => {
          const done    = i < stageIndex;
          const active  = i === stageIndex;
          const future  = i > stageIndex;
          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center gap-2 relative">
              {/* Connector line (before each step except first) */}
              {i > 0 && (
                <div className={`absolute left-0 top-5 w-full h-0.5 -translate-x-1/2 transition-colors duration-500 ${
                  done ? "bg-[#C8290A]" : "bg-gray-200"
                }`} style={{ width: "100%", left: "calc(-50%)" }} />
              )}

              {/* Circle icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                active  ? "bg-[#C8290A] shadow-lg shadow-red-200 ring-4 ring-[#C8290A]/20" :
                done    ? "bg-[#C8290A]" :
                          "bg-gray-100 text-gray-400"
              }`}>
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span className={active ? "text-white" : "text-gray-400"}>
                    {stage.icon(active)}
                  </span>
                )}
                {/* Pulse on active */}
                {active && (
                  <span className="absolute inset-0 rounded-full bg-[#C8290A] animate-ping opacity-20" />
                )}
              </div>

              {/* Label */}
              <div className="text-center px-1">
                <p className={`text-xs font-semibold leading-tight ${
                  active ? "text-[#C8290A]" : done ? "text-gray-700" : "text-gray-400"
                }`}>
                  {stage.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical timeline */}
      <div className="sm:hidden flex flex-col gap-0">
        {ORDER_STAGES.map((stage, i) => {
          const done   = i < stageIndex;
          const active = i === stageIndex;
          return (
            <div key={stage.key} className="flex gap-4">
              {/* Left: icon + connector */}
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                  active  ? "bg-[#C8290A] ring-4 ring-[#C8290A]/20" :
                  done    ? "bg-[#C8290A]" :
                            "bg-gray-100"
                }`}>
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <span className={active ? "text-white" : "text-gray-400"}>
                      {stage.icon(active)}
                    </span>
                  )}
                </div>
                {i < ORDER_STAGES.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 min-h-32px transition-colors duration-500 ${done ? "bg-[#C8290A]" : "bg-gray-200"}`} />
                )}
              </div>

              {/* Right: text */}
              <div className="pb-6 flex-1 min-w-0">
                <p className={`text-sm font-bold leading-tight ${
                  active ? "text-[#C8290A]" : done ? "text-gray-700" : "text-gray-400"
                }`}>
                  {stage.label}
                </p>
                {(active || done) && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{stage.desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active stage description — desktop */}
      {stageIndex >= 0 && (
        <div className="hidden sm:block mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-[#C8290A] font-medium">{ORDER_STAGES[stageIndex]?.desc}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   SINGLE ORDER CARD
───────────────────────────────────── */
function OrderCard({ order, defaultOpen = false }) {
  const [open, setOpen]   = useState(defaultOpen);
  const addItem           = useCartStore((s) => s.addItem);
  const clearCart         = useCartStore((s) => s.clearCart);

  const items      = Array.isArray(order.items) ? order.items : [];
  const stageIndex = STATUS_TO_STAGE[order.status] ?? 0;
  const cancelled  = order.status === "cancelled";

  const waText = encodeURIComponent(
    `Hello KukuMart! 👋 I'm following up on my order #${order.id.slice(0, 8).toUpperCase()}. Can you give me an update?`
  );

  function handleReorder() {
    clearCart();
    items.forEach((item) => addItem(item));
    window.location.href = "/cart";
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      open ? "border-[#C8290A]/30 shadow-sm" : "border-gray-200 hover:border-gray-300"
    }`}>

      {/* Order header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Status dot */}
          <div className={`w-3 h-3 rounded-full shrink-0 ${
            cancelled                    ? "bg-red-400" :
            order.status === "delivered" ? "bg-green-500" :
            order.status === "pending"   ? "bg-amber-400" :
                                           "bg-[#C8290A] animate-pulse"
          }`} />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                cancelled                    ? "bg-red-100 text-red-700" :
                order.status === "delivered" ? "bg-green-100 text-green-700" :
                order.status === "pending"   ? "bg-amber-100 text-amber-700" :
                                               "bg-red-100 text-[#C8290A]"
              }`}>
                {ORDER_STAGES.find((s) => s.key === order.status)?.label ?? order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {formatDate(order.created_at)} · {timeAgo(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900">KSh {order.total?.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
            strokeLinecap="round" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-5 flex flex-col gap-6">

          {/* Status tracker */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Order status
            </p>
            <StatusTracker status={order.status} />
          </div>

          {/* Items ordered */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Items ordered
              </p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {items.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 ${
                    i < items.length - 1 ? "border-b border-gray-50" : ""
                  }`}>
                    <span className="text-xl shrink-0">{CAT_EMOJI[item.category] ?? "🐔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">× {item.quantity} @ KSh {item.price?.toLocaleString()} each</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 shrink-0">
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery + payment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Delivery details
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0 w-20">Name</span>
                  <span className="text-gray-900 font-medium">{order.customer_name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0 w-20">Phone</span>
                  <span className="text-gray-900 font-medium">{order.phone}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400 shrink-0 w-20">Address</span>
                  <span className="text-gray-900 font-medium word-break flex-1">{order.location}</span>
                </div>
                {order.delivery_zone && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0 w-20">Zone</span>
                    <span className="text-gray-900 font-medium">{order.delivery_zone}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0 w-20">Notes</span>
                    <span className="text-gray-900 font-medium italic">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Payment summary
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium text-gray-900">{PAYMENT_LABELS[order.payment_type] ?? order.payment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className={`font-medium ${order.paid ? "text-green-600" : "text-amber-600"}`}>
                    {order.paid ? "✅ Yes" : "⏳ Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">KSh {order.subtotal?.toLocaleString() ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium text-gray-900">KSh {order.delivery_fee?.toLocaleString() ?? "—"}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-[#C8290A]">KSh {order.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b958] text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Ask about this order
            </a>

            {order.status === "delivered" && items.length > 0 && (
              <button
                onClick={handleReorder}
                className="flex-1 flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                </svg>
                Order again
              </button>
            )}

            <Link
              to="/shop"
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   LOOKUP FORM
───────────────────────────────────── */
function LookupForm({ onResults, onLoading }) {
  const [query,  setQuery]  = useState("");
  const [mode,   setMode]   = useState("phone"); // "phone" | "id"
  const [error,  setError]  = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) { setError("Please enter a phone number or order ID."); return; }
    setError("");
    onLoading(true);

    try {
      let dbQuery = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (mode === "phone") {
        // Normalise phone: strip spaces/dashes, handle 07xx and +2547xx
        const phone = q.replace(/[\s-]/g, "");
        const variants = [phone];
        if (phone.startsWith("0"))    variants.push("254" + phone.slice(1));
        if (phone.startsWith("+254")) variants.push(phone.slice(1));
        if (phone.startsWith("254"))  variants.push("0" + phone.slice(3));
        dbQuery = dbQuery.in("phone", variants);
      } else {
        // Search by order ID prefix (first 8 chars)
        const id = q.toUpperCase().replace(/^#/, "");
        dbQuery = dbQuery.ilike("id", `${id}%`);
      }

      const { data, error: dbErr } = await dbQuery;
      if (dbErr) throw dbErr;
      onResults(data ?? [], q);
    } catch (err) {
      setError(err.message ?? "Something went wrong. Please try again.");
      onResults([], q);
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: "phone", label: "📱 By phone" },
          { id: "id",    label: "🔢 By order ID" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => { setMode(opt.id); setQuery(""); setError(""); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              mode === opt.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {mode === "phone" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a2 2 0 012.18-2l3 0a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.91 15a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
          </div>
          <input
            type={mode === "phone" ? "tel" : "text"}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(""); }}
            placeholder={mode === "phone" ? "e.g. 0712 345 678" : "e.g. A1B2C3D4"}
            autoComplete={mode === "phone" ? "tel" : "off"}
            className={`w-full pl-11 pr-4 py-3.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
              error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-[#C8290A] hover:bg-[#a82008] text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap"
        >
          Track
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <p className="text-xs text-gray-400">
        {mode === "phone"
          ? "Enter the phone number you used when placing your order."
          : "Enter the 8-character order ID from your confirmation message."}
      </p>
    </form>
  );
}

/* ─────────────────────────────────────
   SKELETON LOADING STATE
───────────────────────────────────── */
function SkeletonOrder() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-24 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="h-3 w-40 bg-gray-100 rounded" />
        </div>
        <div className="w-5 h-5 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN ORDERS PAGE
───────────────────────────────────── */
export default function Orders() {
  const [searchParams]                   = useSearchParams();
  const [orders,   setOrders]            = useState([]);
  const [loading,  setLoading]           = useState(false);
  const [searched, setSearched]          = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const intervalRef = useRef(null);

  // If coming from order-success page with an ID, auto-search
  const autoId = searchParams.get("id");

  const handleResults = useCallback((results, query) => {
    setOrders(results);
    setSearched(true);
    setSearchedQuery(query);
  }, []);

  // Auto-look up by order ID if navigated from success page
  useEffect(() => {
    if (!autoId) return;
    setLoading(true);
    supabase
      .from("orders")
      .select("*")
      .eq("id", autoId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setOrders([data]);
          setSearched(true);
          setSearchedQuery(autoId);
        }
        setLoading(false);
      });
  }, [autoId]);

  // Auto-refresh every 30 seconds when viewing active orders
  useEffect(() => {
    if (!searched || orders.length === 0) return;
    const hasActive = orders.some(
      (o) => !["delivered", "cancelled"].includes(o.status)
    );
    if (!hasActive) return;

    intervalRef.current = setInterval(async () => {
      // Refresh all currently shown orders
      const ids = orders.map((o) => o.id);
      const { data } = await supabase.from("orders").select("*").in("id", ids);
      if (data) setOrders(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }, 30000);

    return () => clearInterval(intervalRef.current);
  }, [searched, orders]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#C8290A] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Track my order</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Track your order
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Enter your phone number or order ID to see your order status in real time.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* Lookup card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8290A" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Find your order</h2>
              <p className="text-xs text-gray-500">Search by phone or the order ID from your confirmation</p>
            </div>
          </div>
          <LookupForm onResults={handleResults} onLoading={setLoading} />
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            <SkeletonOrder />
            <SkeletonOrder />
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            {orders.length === 0 ? (
              /* No results */
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                  🔍
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">No orders found</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    We couldn't find any orders for <strong className="text-gray-700">{searchedQuery}</strong>.
                    Check the number or ID and try again, or WhatsApp us directly.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hello KukuMart! 👋 I can't find my order. Can you help?")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[#20b958] transition-colors"
                  >
                    WhatsApp us
                  </a>
                  <Link to="/shop" className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    Shop again
                  </Link>
                </div>
              </div>
            ) : (
              /* Order results */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {orders.length} order{orders.length !== 1 ? "s" : ""} found
                  </p>
                  {orders.some((o) => !["delivered","cancelled"].includes(o.status)) && (
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                      Auto-refreshing every 30 s
                    </span>
                  )}
                </div>
                {orders.map((order, i) => (
                  <OrderCard key={order.id} order={order} defaultOpen={i === 0} />
                ))}
              </div>
            )}
          </>
        )}

        {/* First-time — no search yet */}
        {!loading && !searched && !autoId && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: "📱", title: "Use your phone number", desc: "The same number you entered when placing your order." },
              { emoji: "🔢", title: "Use your order ID", desc: "The 8-character ID from your WhatsApp or SMS confirmation." },
              { emoji: "💬", title: "Can't find it?", desc: "WhatsApp us directly and we'll track it down for you." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                <span className="text-3xl block mb-3">{emoji}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bottom: place a new order CTA */}
        <div className="bg-[#C8290A] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-base mb-0.5">Want to place a new order?</h3>
            <p className="text-red-200 text-sm">Fresh chicken delivered anywhere in Nairobi.</p>
          </div>
          <Link
            to="/shop"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-[#C8290A] hover:bg-red-50 font-bold text-sm px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6"/>
            </svg>
            Shop now
          </Link>
        </div>
      </div>
    </div>
  );
}