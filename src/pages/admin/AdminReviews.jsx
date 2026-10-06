// src/pages/admin/AdminReviews.jsx
// Owner view of customer ratings: average, breakdown, and the latest comments.

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { formatDateTimeLong, timeAgo } from "../../lib/time";
import StarRating from "../../components/StarRating";

const ASPECTS = [
  ["quality_rating", "Chicken quality"],
  ["delivery_rating", "Delivery"],
  ["service_rating", "Service"],
];

const avg = (rows, key) => {
  const v = rows.map((r) => r[key]).filter((n) => typeof n === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export default function AdminReviews() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("reviews")
      .select("id, order_id, customer_name, area, rating, quality_rating, delivery_rating, service_rating, comment, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setFailed(true); else setRows(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="h-48 bg-white border border-gray-100 rounded-2xl animate-pulse" />;
  if (failed) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
        Couldn't load ratings. Run <code className="font-mono text-xs">supabase/tracking-and-reviews.sql</code> in Supabase first.
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3" aria-hidden="true">⭐</div>
        <p className="text-sm font-bold text-gray-900 mb-1">No ratings yet</p>
        <p className="text-xs text-gray-500">Customers get a "Rate your order" button in the email we send when an order is delivered.</p>
      </div>
    );
  }

  const overall = avg(rows, "rating");
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, c: rows.filter((r) => r.rating === n).length }));
  const lowNeedingFollowUp = rows.filter((r) => r.rating <= 2).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 grid sm:grid-cols-[auto_1fr_1fr] gap-6 items-center">
        <div className="text-center sm:pr-6 sm:border-r border-gray-100">
          <p className="text-5xl font-bold text-gray-900">{overall.toFixed(1)}</p>
          <div className="mt-1 flex justify-center"><StarRating value={Math.round(overall)} size={18} /></div>
          <p className="text-xs text-gray-400 mt-1">{rows.length} rating{rows.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="space-y-1.5">
          {counts.map(({ n, c }) => (
            <div key={n} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 text-right">{n}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(c / rows.length) * 100}%` }} />
              </div>
              <span className="w-6">{c}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {ASPECTS.map(([k, label]) => {
            const a = avg(rows, k);
            return (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{a ? `${a.toFixed(1)} / 5` : "—"}</span>
              </div>
            );
          })}
          {lowNeedingFollowUp > 0 && (
            <p className="text-xs font-semibold text-red-600 pt-1">⚠ {lowNeedingFollowUp} low rating{lowNeedingFollowUp !== 1 ? "s" : ""} (1–2 stars) to follow up</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.id} className={`bg-white border rounded-2xl p-4 ${r.rating <= 2 ? "border-red-200" : "border-gray-200"}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <StarRating value={r.rating} size={18} />
                <p className="text-xs text-gray-500 mt-1">
                  {r.customer_name || "Customer"}{r.area ? ` · ${r.area}` : ""} ·{" "}
                  <span className="font-mono">#{String(r.order_id).slice(0, 8).toUpperCase()}</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 text-right shrink-0" title={formatDateTimeLong(r.created_at)}>{timeAgo(r.created_at)}</p>
            </div>
            {ASPECTS.some(([k]) => r[k]) && (
              <p className="text-xs text-gray-500 mb-1">
                {ASPECTS.filter(([k]) => r[k]).map(([k, l]) => `${l} ${r[k]}/5`).join(" · ")}
              </p>
            )}
            {r.comment && <p className="text-sm text-gray-700 leading-relaxed wrap-break-word">“{r.comment}”</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
