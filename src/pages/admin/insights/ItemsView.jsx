import { useState, useMemo } from "react";
import { buildProducts } from "../../../lib/adminStats";
import { toCsv, downloadCsv } from "../../../lib/csv";
import { formatDate, nairobiDayKey } from "../../../lib/time";
import { ksh } from "./orderMeta";

const CAT_EMOJI = { slaughtered: "🥩", fried_pieces: "🍗", fried_whole: "🍖" };

export default function ItemsView({ orders }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const products = useMemo(() => buildProducts(orders), [orders]);
  const shown = products.filter((p) => !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()));

  function exportCsv() {
    const rows = products.flatMap((p) => p.buyers.map((b) => ({ p, b })));
    const csv = toCsv([
      { header: "Item", value: (r) => r.p.name },
      { header: "Customer", value: (r) => r.b.name },
      { header: "Phone", value: (r) => r.b.phone },
      { header: "Quantity", value: (r) => r.b.qty },
      { header: "Orders", value: (r) => r.b.orders },
      { header: "Last order (Nairobi)", value: (r) => formatDate(r.b.lastAt) },
    ], rows);
    downloadCsv(`kukumart-items-sold-${nairobiDayKey(new Date())}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…" aria-label="Search items"
          className="flex-1 px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A]" />
        <button type="button" onClick={exportCsv} disabled={!products.length}
          className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">
          ⬇ Download CSV (who bought what)
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">
          {products.length ? "No items match your search." : "No items sold in this period yet."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((p) => {
            const isOpen = open === p.key;
            return (
              <li key={p.key} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-2xl" aria-hidden="true">{CAT_EMOJI[p.category] ?? "🐔"}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                    <span className="block text-xs text-gray-500">{p.orders} order{p.orders !== 1 ? "s" : ""} · {p.buyers.length} customer{p.buyers.length !== 1 ? "s" : ""}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-sm font-bold text-gray-900 tabular-nums">{p.units} sold</span>
                    <span className="block text-xs text-gray-500 tabular-nums">{ksh(p.revenue)}</span>
                  </span>
                  <span className="text-gray-400 text-xs w-3" aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-xs min-w-[420px]">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left font-semibold px-4 py-2">Customer</th>
                          <th className="text-right font-semibold px-4 py-2">Qty</th>
                          <th className="text-right font-semibold px-4 py-2">Orders</th>
                          <th className="text-right font-semibold px-4 py-2">Last order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {p.buyers.map((b) => (
                          <tr key={b.key}>
                            <td className="px-4 py-2">
                              <span className="font-medium text-gray-900">{b.name}</span>
                              {b.phone && <a href={`tel:${b.phone}`} className="block text-gray-400 hover:text-[#C8290A]">{b.phone}</a>}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums font-semibold text-gray-900">{b.qty}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-gray-600">{b.orders}</td>
                            <td className="px-4 py-2 text-right text-gray-500 whitespace-nowrap">{formatDate(b.lastAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
