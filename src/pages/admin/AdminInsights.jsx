import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchAll } from "../../lib/adminData";
import { inRange, kpis } from "../../lib/adminStats";
import OverviewView from "./insights/OverviewView";
import CustomersView from "./insights/CustomersView";
import ItemsView from "./insights/ItemsView";

const RANGES = [{ id: 7, label: "7 days" }, { id: 30, label: "30 days" }, { id: 90, label: "90 days" }, { id: null, label: "All time" }];
const VIEWS = [{ id: "overview", label: "Overview" }, { id: "customers", label: "Customers" }, { id: "items", label: "Items sold" }];

export default function AdminInsights() {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);
  const [days, setDays] = useState(30);
  const [view, setView] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [o, r] = await Promise.all([
      fetchAll("orders", "*"),
      fetchAll("reviews", "order_id, rating, quality_rating, delivery_rating, service_rating, comment, customer_name, created_at"),
    ]);
    if (o.error) setError(o.error.message ?? "Could not load orders");
    else { setOrders(o.data); setTruncated(o.truncated); }
    setReviews(r.error ? [] : r.data);                      // ratings are optional; orders still show without them
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const rangeOrders = useMemo(() => inRange(orders, days), [orders, days]);
  const rangeReviews = useMemo(() => inRange(reviews, days), [reviews, days]);
  const kpi = useMemo(() => kpis(rangeOrders, orders, rangeReviews), [rangeOrders, orders, rangeReviews]);
  const counted = useMemo(() => rangeOrders.filter((o) => o.status !== "cancelled"), [rangeOrders]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div role="tablist" className="inline-flex bg-gray-100 rounded-xl p-1 self-start">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${view === v.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>{v.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={days ?? "all"} onChange={(e) => setDays(e.target.value === "all" ? null : Number(e.target.value))} aria-label="Time range"
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl">
            {RANGES.map((r) => <option key={r.label} value={r.id ?? "all"}>{r.id ? `Last ${r.label}` : r.label}</option>)}
          </select>
          <button type="button" onClick={load} disabled={loading} className="px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-60">{loading ? "Loading…" : "↻ Refresh"}</button>
        </div>
      </div>

      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">Couldn’t load data: {error}</div>}
      {truncated && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3">Showing the most recent 20,000 orders only.</div>}

      {loading && !orders.length ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">Loading insights…</div>
      ) : (
        <>
          {view === "overview" && <OverviewView orders={counted} kpi={kpi} days={days} onNavigate={setView} />}
          {view === "customers" && <CustomersView orders={rangeOrders} ratings={rangeReviews} />}
          {view === "items" && <ItemsView orders={counted} />}
        </>
      )}
    </div>
  );
}
