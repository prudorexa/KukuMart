import { useState, useMemo } from "react";
import { CUSTOMER_SORTS, searchCustomers, buildCustomers, ratingsByOrder, itemsOf } from "../../../lib/adminStats";
import { toCsv, downloadCsv } from "../../../lib/csv";
import { formatDate, formatDateTime, timeAgo, nairobiDayKey } from "../../../lib/time";
import { ksh } from "./orderMeta";
import StatusBadge from "./StatusBadge";

const PAGE = 25;

function CustomerModal({ c, onClose, reviews }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Customer ${c.name}`}>
      <div className="bg-white w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
            <p className="text-xs text-gray-500">Customer since {formatDate(c.firstAt)} · last order {timeAgo(c.lastAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold">
          {c.phone && <a href={`tel:${c.phone}`} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800">📞 {c.phone}</a>}
          {c.whatsapp && <a href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-green-100 text-green-800">WhatsApp</a>}
          {c.email && <a href={`mailto:${c.email}`} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800">✉ {c.email}</a>}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          {[["Spent", ksh(c.spent)], ["Orders", c.counted], ["Avg order", ksh(c.avgOrder)]].map(([l, v]) => (
            <div key={l} className="bg-gray-50 rounded-xl py-2"><div className="text-[11px] text-gray-500">{l}</div><div className="text-sm font-bold text-gray-900 tabular-nums">{v}</div></div>
          ))}
        </div>
        {c.favourites.length > 0 && <p className="text-xs text-gray-600 mb-4"><b>Favourites:</b> {c.favourites.map((f) => `${f.name} ×${f.qty}`).join(", ")}</p>}
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Order history</h4>
        <ul className="flex flex-col gap-2">
          {c.orders.map((o) => (
            <li key={o.id} className="border border-gray-100 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-gray-500">#{String(o.id).slice(0, 8).toUpperCase()}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-gray-800">{itemsOf(o).map((i) => `${i.name} ×${i.qty ?? i.quantity ?? 1}`).join(", ") || "—"}</div>
              <div className="flex justify-between mt-1 text-gray-500"><span>{formatDateTime(o.created_at)}</span><span className="font-semibold text-gray-900 tabular-nums">{ksh(o.total)}</span></div>
              {reviews[o.id] && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-gray-700">
                  <span className="text-amber-500">{"★".repeat(reviews[o.id].rating)}{"☆".repeat(5 - reviews[o.id].rating)}</span>
                  {reviews[o.id].comment && <span className="block italic mt-0.5">“{reviews[o.id].comment}”</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CustomersView({ orders, ratings }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("spent");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState(null);

  const reviewMap = useMemo(() => Object.fromEntries((ratings ?? []).filter((r) => r.order_id).map((r) => [r.order_id, r])), [ratings]);
  const customers = useMemo(() => {
    const list = searchCustomers(buildCustomers(orders, ratingsByOrder(ratings)), query);
    return [...list].sort(CUSTOMER_SORTS[sort].fn);
  }, [orders, ratings, query, sort]);

  function exportCsv() {
    downloadCsv(`kukumart-customers-${nairobiDayKey(new Date())}.csv`, toCsv([
      { header: "Name", value: (c) => c.name }, { header: "Phone", value: (c) => c.phone },
      { header: "Email", value: (c) => c.email }, { header: "Orders", value: (c) => c.counted },
      { header: "Total spent (KSh)", value: (c) => c.spent }, { header: "Average rating", value: (c) => c.avgRating ?? "" },
      { header: "Favourites", value: (c) => c.favourites.map((f) => `${f.name} x${f.qty}`).join("; ") },
      { header: "Last order (Nairobi)", value: (c) => formatDate(c.lastAt) },
    ], customers));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Search name, phone or email…" aria-label="Search customers"
          className="flex-1 px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A]" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort customers" className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl">
          <option value="spent">Top spenders</option><option value="orders">Most orders</option><option value="recent">Most recent</option><option value="name">Name A–Z</option>
        </select>
        <button type="button" onClick={exportCsv} disabled={!customers.length} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">⬇ CSV</button>
      </div>
      {customers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">{query ? "No customers match your search." : "No customers in this period yet."}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-xs text-gray-500"><tr>
              <th className="text-left font-semibold px-4 py-2.5">Customer</th><th className="text-right font-semibold px-4 py-2.5">Orders</th>
              <th className="text-right font-semibold px-4 py-2.5">Spent</th><th className="text-left font-semibold px-4 py-2.5">Favourite</th>
              <th className="text-right font-semibold px-4 py-2.5">Rating</th><th className="text-right font-semibold px-4 py-2.5">Last order</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {customers.slice(0, limit).map((c) => (
                <tr key={c.key} onClick={() => setSelected(c)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3"><button type="button" className="font-semibold text-gray-900 text-left">{c.name}</button>
                    {c.returning && <span className="ml-2 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Returning</span>}
                    <div className="text-xs text-gray-400">{c.phone || c.email}</div></td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.counted}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{ksh(c.spent)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{c.favourites[0]?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-xs">{c.avgRating ? `${c.avgRating.toFixed(1)} ★` : "—"}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">{timeAgo(c.lastAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length > limit && <button type="button" onClick={() => setLimit(limit + PAGE)} className="w-full py-3 text-sm font-semibold text-[#C8290A] hover:bg-gray-50">Show more ({customers.length - limit} left)</button>}
        </div>
      )}
      {selected && <CustomerModal c={selected} reviews={reviewMap} onClose={() => setSelected(null)} />}
    </div>
  );
}
