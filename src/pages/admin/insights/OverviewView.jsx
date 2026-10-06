import { StatTile, ChartCard, ColumnChart, BarList, SimpleTable } from "./Charts";
import { dailySeries, hourSeries, hourLabel, breakdown, buildProducts } from "../../../lib/adminStats";
import { PAYMENT_LABELS, ksh } from "./orderMeta";

const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);

export default function OverviewView({ orders, kpi, days, onNavigate }) {
  const span = days ?? 90;                                    // "All time" still draws the latest 90 days
  const daily = dailySeries(orders, span);
  const hours = hourSeries(orders);
  const payments = breakdown(orders, (o) => PAYMENT_LABELS[o.payment_type] ?? o.payment_type);
  const zones = breakdown(orders, (o) => (o.delivery_zone && o.delivery_zone !== "To be confirmed" ? o.delivery_zone : "Area not set"));
  const best = buildProducts(orders).slice(0, 5);

  const bestDay = daily.reduce((m, d) => (d.revenue > (m?.revenue ?? 0) ? d : m), null);
  const peakHour = hours.reduce((m, h) => (h.orders > (m?.orders ?? 0) ? h : m), null);
  const peakIndex = peakHour ? peakHour.hour : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatTile label="Sales" value={ksh(kpi.revenue)} sub="Excludes cancelled" />
        <StatTile label="Orders" value={kpi.orders.toLocaleString()} sub={kpi.cancelled ? `${kpi.cancelled} cancelled` : "None cancelled"} />
        <StatTile label="Average order" value={ksh(kpi.avgOrder)} />
        <StatTile label="Customers" value={kpi.customers.toLocaleString()} sub="Ordered in this period" />
        <StatTile label="Returning customers" value={pct(kpi.returningRate)} sub="Have ordered 2+ times" />
        <StatTile label="Customer rating" value={kpi.avgRating ? `${kpi.avgRating.toFixed(1)} ★` : "—"} sub={kpi.ratingCount ? `${kpi.ratingCount} rating${kpi.ratingCount !== 1 ? "s" : ""}` : "No ratings yet"} />
      </div>

      <ChartCard
        title="Sales per day"
        subtitle={bestDay ? `${days ? "" : "Latest 90 days · "}Best day: ${bestDay.label}, ${ksh(bestDay.revenue)} from ${bestDay.orders} order${bestDay.orders !== 1 ? "s" : ""}` : "No sales in this period"}
        empty={kpi.orders === 0 ? "No orders in this period yet." : null}
        chart={<ColumnChart ariaLabel="Sales per day" data={daily.map((d) => ({ key: d.key, label: d.label, value: d.revenue, lines: [["Orders", d.orders]] }))} valueFormat={ksh} />}
        table={<SimpleTable columns={[
          { header: "Day", value: (r) => r.label },
          { header: "Orders", right: true, value: (r) => r.orders },
          { header: "Sales", right: true, value: (r) => ksh(r.revenue) },
        ]} rows={[...daily].reverse()} />}
      />

      <ChartCard
        title="When customers order"
        subtitle={peakHour && peakHour.orders > 0 ? `Busiest hour: ${hourLabel(peakHour.hour)} (${peakHour.orders} order${peakHour.orders !== 1 ? "s" : ""}) · Nairobi time` : "Nairobi time"}
        empty={kpi.orders === 0 ? "No orders in this period yet." : null}
        chart={<ColumnChart ariaLabel="Orders by hour of day" integer highlight={peakIndex} valueFormat={(v) => `${v} order${v !== 1 ? "s" : ""}`}
          axisFormat={(v) => String(Math.round(v))}
          data={hours.map((h) => ({ key: h.hour, label: hourLabel(h.hour), value: h.orders, lines: [["Sales", ksh(h.revenue)]] }))} />}
        table={<SimpleTable columns={[
          { header: "Hour", value: (r) => hourLabel(r.hour) },
          { header: "Orders", right: true, value: (r) => r.orders },
          { header: "Sales", right: true, value: (r) => ksh(r.revenue) },
        ]} rows={hours} />}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Best sellers</h3>
            <button type="button" onClick={() => onNavigate("items")} className="text-xs font-semibold text-[#C8290A] hover:underline">See who bought →</button>
          </div>
          <BarList rows={best.map((p) => ({ key: p.key, label: p.name, value: p.units, display: `${p.units} sold`, sub: `${ksh(p.revenue)} · ${p.buyers.length} customer${p.buyers.length !== 1 ? "s" : ""}` }))} empty="No sales yet." />
        </section>
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">How customers pay</h3>
          <BarList rows={payments.map((p) => ({ key: p.key, label: p.key, value: p.orders, display: `${p.orders} order${p.orders !== 1 ? "s" : ""}`, sub: ksh(p.revenue) }))} empty="No orders yet." />
        </section>
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Delivery areas</h3>
          <BarList rows={zones.slice(0, 8).map((z) => ({ key: z.key, label: z.key, value: z.orders, display: `${z.orders} order${z.orders !== 1 ? "s" : ""}`, sub: ksh(z.revenue) }))} empty="No orders yet." />
        </section>
      </div>
    </div>
  );
}
