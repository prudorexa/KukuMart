// src/lib/adminStats.js
// Pure functions that turn the raw orders + ratings into the numbers the admin sees.
// No React, no network — so they are easy to test. All days and hours are Nairobi time.
//
// Money rule used everywhere: cancelled orders never count as sales, customers or items sold.

import { toDate, nairobiDayKey, nairobiHour, lastDayKeys, startOfTodayNairobi, formatDayKey } from "./time";

const DAY_MS = 24 * 60 * 60 * 1000;
const num = (n) => Number(n) || 0;

export const isCounted = (o) => o?.status !== "cancelled";

export function itemsOf(order) {
  let items = order?.items;
  if (typeof items === "string") {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  return Array.isArray(items) ? items.filter((i) => i && typeof i === "object") : [];
}

/** 0712 345 678, +254712345678 and 254712345678 are the same person. */
export function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 12 && digits.startsWith("254")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

/** Who ordered: by phone first (guests have no account), then account, then email. */
export function customerKey(order) {
  const phone = normalizePhone(order.phone);
  if (phone) return `tel:${phone}`;
  if (order.user_id) return `user:${order.user_id}`;
  const email = String(order.email ?? "").trim().toLowerCase();
  if (email) return `mail:${email}`;
  return `order:${order.id}`;
}

const itemKey = (i) => String(i.id ?? i.name ?? "unknown");
const byNewest = (a, b) => toDate(b.created_at) - toDate(a.created_at);

/** days = 7 | 30 | 90 → the last N Nairobi days including today; falsy → everything. */
export function inRange(rows, days, now = new Date(), field = "created_at") {
  if (!days) return rows;
  const start = startOfTodayNairobi(now).getTime() - (days - 1) * DAY_MS;
  return rows.filter((r) => toDate(r[field]).getTime() >= start);
}

/** { [order_id]: rating } from the reviews list. */
export function ratingsByOrder(reviews) {
  const out = {};
  for (const r of reviews ?? []) if (r?.order_id && typeof r.rating === "number") out[r.order_id] = r.rating;
  return out;
}

const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);

/* ───────────────────────── Customers ───────────────────────── */

export function buildCustomers(orders, ratings = {}) {
  const map = new Map();
  for (const o of [...orders].sort(byNewest)) {            // newest first → newest details win
    const key = customerKey(o);
    let c = map.get(key);
    if (!c) {
      c = {
        key, name: "", phone: "", email: "", orders: [],
        spent: 0, counted: 0, cancelled: 0, delivered: 0, units: 0,
        itemQty: new Map(), zones: new Map(), ratingList: [],
      };
      map.set(key, c);
    }
    c.orders.push(o);
    if (!c.name && o.customer_name) c.name = String(o.customer_name).trim();
    if (!c.phone && o.phone) c.phone = String(o.phone).trim();
    if (!c.email && o.email) c.email = String(o.email).trim();

    if (!isCounted(o)) { c.cancelled += 1; continue; }
    c.counted += 1;
    c.spent += num(o.total);
    if (o.status === "delivered") c.delivered += 1;
    if (o.delivery_zone && o.delivery_zone !== "To be confirmed") c.zones.set(o.delivery_zone, (c.zones.get(o.delivery_zone) ?? 0) + 1);
    for (const it of itemsOf(o)) {
      const q = num(it.quantity) || 1;
      c.units += q;
      const name = String(it.name ?? "Item");
      c.itemQty.set(name, (c.itemQty.get(name) ?? 0) + q);
    }
    if (typeof ratings[o.id] === "number") c.ratingList.push(ratings[o.id]);
  }

  return [...map.values()].map((c) => {
    const times = c.orders.map((o) => toDate(o.created_at).getTime()).filter((t) => !Number.isNaN(t));
    return {
      key: c.key,
      name: c.name || "Customer",
      phone: c.phone,
      whatsapp: normalizePhone(c.phone),
      email: c.email,
      orders: c.orders,                                   // newest first
      orderCount: c.orders.length,
      counted: c.counted,
      cancelled: c.cancelled,
      delivered: c.delivered,
      spent: c.spent,
      avgOrder: c.counted ? c.spent / c.counted : 0,
      units: c.units,
      firstAt: times.length ? new Date(Math.min(...times)).toISOString() : null,
      lastAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
      favourites: [...c.itemQty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, qty]) => ({ name, qty })),
      topZone: [...c.zones.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
      ratingCount: c.ratingList.length,
      avgRating: avg(c.ratingList),
      returning: c.counted >= 2,
    };
  });
}

export const CUSTOMER_SORTS = {
  spent:  { label: "Highest spend",  fn: (a, b) => b.spent - a.spent },
  orders: { label: "Most orders",    fn: (a, b) => b.counted - a.counted || b.spent - a.spent },
  recent: { label: "Most recent",    fn: (a, b) => toDate(b.lastAt) - toDate(a.lastAt) },
  name:   { label: "Name A–Z",       fn: (a, b) => a.name.localeCompare(b.name) },
};

export function searchCustomers(customers, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return customers;
  const digits = q.replace(/\D/g, "");
  return customers.filter((c) =>
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    (digits.length >= 3 && normalizePhone(c.phone).includes(digits.replace(/^0/, "").replace(/^254/, "")))
  );
}

/* ───────────────────────── Items sold ───────────────────────── */

export function buildProducts(orders) {
  const map = new Map();
  for (const o of [...orders].filter(isCounted).sort(byNewest)) {
    const cKey = customerKey(o);
    for (const it of itemsOf(o)) {
      const key = itemKey(it);
      const qty = num(it.quantity) || 1;
      let p = map.get(key);
      if (!p) { p = { key, name: String(it.name ?? "Item"), category: it.category ?? "", units: 0, revenue: 0, orderIds: new Set(), buyers: new Map() }; map.set(key, p); }
      p.units += qty;
      p.revenue += num(it.price) * qty;
      p.orderIds.add(o.id);
      let b = p.buyers.get(cKey);
      if (!b) { b = { key: cKey, name: o.customer_name || "Customer", phone: o.phone || "", qty: 0, orders: 0, lastAt: o.created_at }; p.buyers.set(cKey, b); }
      b.qty += qty;
      b.orders += 1;
    }
  }
  return [...map.values()]
    .map((p) => ({
      key: p.key, name: p.name, category: p.category, units: p.units, revenue: p.revenue,
      orders: p.orderIds.size,
      buyers: [...p.buyers.values()].sort((a, b) => b.qty - a.qty || toDate(b.lastAt) - toDate(a.lastAt)),
    }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue);
}

/* ───────────────────────── Time series ───────────────────────── */

/** One entry per Nairobi day for the last `days` days (days with no orders are 0, not missing). */
export function dailySeries(orders, days, now = new Date()) {
  const keys = lastDayKeys(days, now);
  const rows = new Map(keys.map((k) => [k, { key: k, label: formatDayKey(k), revenue: 0, orders: 0 }]));
  for (const o of orders) {
    if (!isCounted(o)) continue;
    const row = rows.get(nairobiDayKey(o.created_at));
    if (row) { row.revenue += num(o.total); row.orders += 1; }
  }
  return keys.map((k) => rows.get(k));
}

/** Orders per hour of the day (0–23), Nairobi time. */
export function hourSeries(orders) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0, revenue: 0 }));
  for (const o of orders) {
    if (!isCounted(o)) continue;
    const d = toDate(o.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const row = hours[nairobiHour(d)];
    row.orders += 1;
    row.revenue += num(o.total);
  }
  return hours;
}

export function hourLabel(h) {
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${suffix}`;
}

/** Count + revenue grouped by any field (payment type, delivery zone…), biggest first. */
export function breakdown(orders, getKey) {
  const map = new Map();
  for (const o of orders) {
    if (!isCounted(o)) continue;
    const key = getKey(o) || "Not set";
    const row = map.get(key) ?? { key, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += num(o.total);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue);
}

/* ───────────────────────── Headline numbers ───────────────────────── */

export function kpis(rangeOrders, allOrders, reviewsInRange = []) {
  const counted = rangeOrders.filter(isCounted);
  const revenue = counted.reduce((s, o) => s + num(o.total), 0);

  const allCounts = new Map();
  for (const o of allOrders) if (isCounted(o)) allCounts.set(customerKey(o), (allCounts.get(customerKey(o)) ?? 0) + 1);
  const active = new Set(counted.map(customerKey));
  const returning = [...active].filter((k) => (allCounts.get(k) ?? 0) >= 2).length;

  const ratings = reviewsInRange.map((r) => r.rating).filter((n) => typeof n === "number");
  return {
    revenue,
    orders: counted.length,
    avgOrder: counted.length ? revenue / counted.length : 0,
    customers: active.size,
    returningRate: active.size ? returning / active.size : null,
    cancelled: rangeOrders.length - counted.length,
    cancelRate: rangeOrders.length ? (rangeOrders.length - counted.length) / rangeOrders.length : null,
    avgRating: avg(ratings),
    ratingCount: ratings.length,
  };
}
