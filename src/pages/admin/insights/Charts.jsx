// src/pages/admin/insights/Charts.jsx
// Small, dependency-free chart parts: stat tile, chart card (with table view),
// column chart (hover + keyboard tooltip) and ranked bar list.

import { useState } from "react";
import { BLUE, DIM, GRID, AXIS, INK, INK_SECOND, INK_MUTED } from "./chartTokens";

/* ── Headline number ── */
export function StatTile({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ── Card with a Chart / Table switch (the table is the accessible, always-reachable view) ── */
export function ChartCard({ title, subtitle, chart, table, empty }) {
  const [view, setView] = useState("chart");
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5" aria-label={title}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {!empty && table && (
          <div className="inline-flex shrink-0 rounded-lg bg-gray-100 p-0.5" role="group" aria-label="View">
            {["chart", "table"].map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
      {empty ? <p className="text-sm text-gray-400 py-10 text-center">{empty}</p> : view === "chart" ? chart : table}
    </section>
  );
}

export function SimpleTable({ columns, rows, maxHeight = 288 }) {
  return (
    <div className="overflow-auto border border-gray-100 rounded-xl" style={{ maxHeight }}>
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-50">
          <tr>{columns.map((c) => (
            <th key={c.header} className={`px-3 py-2 font-semibold text-gray-500 ${c.right ? "text-right" : "text-left"}`}>{c.header}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((r, i) => (
            <tr key={r.key ?? i}>{columns.map((c) => (
              <td key={c.header} className={`px-3 py-1.5 text-gray-700 tabular-nums ${c.right ? "text-right" : ""}`}>{c.value(r)}</td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Nice round axis maximum: 1, 2, 5 × 10ⁿ ── */
function niceMax(v) {
  if (!(v > 0)) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

const compact = (n) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(Math.round(n)));

/**
 * Column chart. data: [{ key, label, value, lines?: [[name, text]] }]
 *  - highlight: index drawn in the series colour while the rest are dimmed (emphasis form)
 *  - valueFormat: how a value reads in the tooltip/aria label
 *  - axisFormat: how the y-axis ticks read
 */
export function ColumnChart({ data, valueFormat, axisFormat = compact, highlight = null, height = 176, ariaLabel, integer = false }) {
  const [active, setActive] = useState(null);
  const n = data.length;
  const top = Math.max(0, ...data.map((d) => d.value));
  // Counts: keep the axis on even whole numbers (0 / 2 / 4) so the middle tick is never "2.5".
  const max = integer && top <= 10 ? [2, 4, 6, 8, 10].find((m) => top <= m) : niceMax(top);
  const ticks = [0, max / 2, max];
  const step = Math.max(1, Math.ceil(n / 6));
  const act = active == null ? null : data[active];

  return (
    <div className="relative" style={{ height: height + 28, paddingLeft: 44 }} role="group" aria-label={ariaLabel}>
      {/* y axis + hairline grid */}
      <div className="absolute left-0 right-0 top-2" style={{ height }}>
        {ticks.map((t) => (
          <div key={t} className="absolute left-0 right-0" style={{ bottom: `${(t / max) * 100}%` }}>
            <span className="absolute -translate-y-1/2 text-[10px] tabular-nums" style={{ left: 0, color: INK_MUTED, width: 38, textAlign: "right" }}>{axisFormat(t)}</span>
            <div style={{ marginLeft: 44, borderTop: `1px solid ${t === 0 ? AXIS : GRID}` }} />
          </div>
        ))}
      </div>

      {/* columns */}
      <div className="absolute top-2 flex items-stretch" style={{ left: 44, right: 0, height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const isHi = highlight == null || highlight === i;
          const dimmed = active != null && active !== i;
          return (
            <div key={d.key} tabIndex={0} role="img"
              aria-label={`${d.label}: ${valueFormat(d.value)}${d.lines?.length ? `, ${d.lines.map(([k, v]) => `${k} ${v}`).join(", ")}` : ""}`}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              className="relative flex-1 outline-none cursor-default focus-visible:bg-gray-50"
              style={{ minWidth: 0 }}>
              {d.value > 0 && (
                <div className="absolute bottom-0 left-1/2" style={{
                  height: `${Math.max(pct, 1.5)}%`, width: "calc(100% - 2px)", maxWidth: 24, transform: "translateX(-50%)",
                  background: isHi ? BLUE : DIM, borderRadius: "4px 4px 0 0",
                  opacity: dimmed ? 0.5 : 1, transition: "opacity 120ms",
                }} />
              )}
            </div>
          );
        })}

        {act && (
          <div className="absolute z-10 pointer-events-none top-0" style={{
            left: `${((active + 0.5) / n) * 100}%`,
            transform: active / n < 0.15 ? "translateX(-8px)" : active / n > 0.85 ? "translateX(calc(-100% + 8px))" : "translateX(-50%)",
          }}>
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
              <p className="text-sm font-semibold" style={{ color: INK }}>{valueFormat(act.value)}</p>
              <p className="text-xs" style={{ color: INK_SECOND }}>{act.label}</p>
              {act.lines?.map(([k, v]) => <p key={k} className="text-xs" style={{ color: INK_MUTED }}>{k}: {v}</p>)}
            </div>
          </div>
        )}
      </div>

      {/* x labels (every few columns, never every one) */}
      <div className="absolute" style={{ left: 44, right: 0, top: height + 12 }}>
        {data.map((d, i) => (i % step === 0 ? (
          <span key={d.key} className="absolute text-[10px] whitespace-nowrap" style={{ left: `${((i + 0.5) / n) * 100}%`, transform: "translateX(-50%)", color: INK_MUTED }}>
            {d.axisLabel ?? d.label}
          </span>
        ) : null))}
      </div>
    </div>
  );
}

/* ── Ranked horizontal bars: one colour for every bar (nominal categories) ── */
export function BarList({ rows, empty = "Nothing here yet." }) {
  if (!rows.length) return <p className="text-sm text-gray-400 py-6 text-center">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-gray-800 truncate" title={r.label}>{r.label}</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">{r.display}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden" role="presentation">
            <div className="h-full" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: BLUE, borderRadius: "0 4px 4px 0" }} />
          </div>
          {r.sub && <p className="text-xs text-gray-400 mt-0.5">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
