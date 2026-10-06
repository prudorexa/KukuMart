// src/pages/dashboard/DashReviews.jsx
// "Reviews" tab: delivered orders waiting for a rating, plus ratings the customer already gave.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/authStore";
import { formatDate, toDate } from "../../lib/time";
import StarRating from "../../components/StarRating";

const ASPECT_LABELS = [
  ["quality_rating", "Quality"],
  ["delivery_rating", "Delivery"],
  ["service_rating", "Service"],
];

function phoneVariants(raw) {
  if (!raw) return [];
  const p = raw.replace(/[\s-]/g, "");
  const v = [p];
  if (p.startsWith("+254")) v.push("0" + p.slice(4), "254" + p.slice(4));
  else if (p.startsWith("254")) v.push("+" + p, "0" + p.slice(3));
  else if (p.startsWith("0")) v.push("254" + p.slice(1), "+254" + p.slice(1));
  return v;
}

const ref = (id) => String(id).slice(0, 8).toUpperCase();

export default function DashReviews() {
  const { user, profile } = useAuthStore();
  const [orders, setOrders]   = useState([]);
  const [reviews, setReviews] = useState({}); // order_id → review row
  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setFailed(false);
      try {
        const variants = phoneVariants(user.phone ?? profile?.phone ?? "");
        const [byPhone, byUser] = await Promise.all([
          variants.length
            ? supabase.from("orders").select("*").in("phone", variants).eq("status", "delivered")
            : Promise.resolve({ data: [] }),
          supabase.from("orders").select("*").eq("user_id", user.id).eq("status", "delivered"),
        ]);
        const seen = new Set();
        const delivered = [...(byPhone.data ?? []), ...(byUser.data ?? [])]
          .filter((o) => (seen.has(o.id) ? false : seen.add(o.id)))
          .sort((a, b) => toDate(b.created_at) - toDate(a.created_at));

        let map = {};
        if (delivered.length) {
          const { data } = await supabase
            .from("reviews")
            .select("order_id, rating, quality_rating, delivery_rating, service_rating, comment, created_at")
            .in("order_id", delivered.map((o) => o.id));
          map = Object.fromEntries((data ?? []).map((r) => [r.order_id, r]));
        }
        if (!cancelled) { setOrders(delivered); setReviews(map); }
      } catch (err) {
        console.error("Error loading reviews:", err);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[0, 1].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }
  if (failed) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
        <p className="text-sm font-bold text-gray-900 mb-1">Couldn't load your reviews</p>
        <p className="text-xs text-gray-500">Check your connection and refresh the page.</p>
      </div>
    );
  }

  const waiting = orders.filter((o) => !reviews[o.id]);
  const rated   = orders.filter((o) => reviews[o.id]);

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">⭐</div>
        <p className="text-sm font-bold text-gray-900 mb-1">Nothing to rate yet</p>
        <p className="text-xs text-gray-500 mb-4">Once an order is delivered you can rate it here — we'll also email you a link.</p>
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline">Browse the shop →</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {waiting.length > 0 && (
        <section aria-labelledby="waiting-h">
          <h2 id="waiting-h" className="text-sm font-bold text-gray-900 mb-3">
            Waiting for your rating <span className="text-gray-400 font-medium">({waiting.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {waiting.map((o) => {
              const items = Array.isArray(o.items) ? o.items : [];
              return (
                <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold text-gray-600">#{ref(o.id)} · {formatDate(o.created_at)}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "Your order"}</p>
                  </div>
                  <Link to={`/rate?id=${o.id}`}
                    className="shrink-0 px-4 py-2 rounded-xl bg-[#C8290A] hover:bg-[#a82008] text-white text-xs font-semibold transition-colors">
                    ⭐ Rate
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {rated.length > 0 && (
        <section aria-labelledby="rated-h">
          <h2 id="rated-h" className="text-sm font-bold text-gray-900 mb-3">
            Your ratings <span className="text-gray-400 font-medium">({rated.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {rated.map((o) => {
              const r = reviews[o.id];
              return (
                <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-mono font-bold text-gray-600">#{ref(o.id)}</p>
                    <p className="text-xs text-gray-400">Rated {formatDate(r.created_at)}</p>
                  </div>
                  <StarRating value={r.rating} size={20} />
                  {ASPECT_LABELS.some(([k]) => r[k]) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {ASPECT_LABELS.filter(([k]) => r[k]).map(([k, l]) => `${l} ${r[k]}/5`).join(" · ")}
                    </p>
                  )}
                  {r.comment && <p className="text-sm text-gray-700 mt-2 leading-relaxed wrap-break-word">“{r.comment}”</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
