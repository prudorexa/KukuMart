// src/lib/time.js
// ONE place for every date/time the site shows, always in Nairobi time (EAT, UTC+3),
// no matter what time zone the visitor's phone or laptop is set to.
//
// Why this exists: `new Date(x).toLocaleString()` uses the DEVICE's time zone, and
// timestamps from the database sometimes arrive without a "Z"/offset (e.g.
// "2026-10-05T11:11:00") which JavaScript then wrongly reads as LOCAL time.
// Both made order times wrong. Everything here fixes the zone explicitly.

export const TIME_ZONE = "Africa/Nairobi";
const LOCALE = "en-KE";

/** Parse a DB timestamp safely. Values with no zone info are treated as UTC. */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value !== "string" || !value) return new Date(NaN);
  const s = value.trim().replace(" ", "T");
  const hasZone = /(Z|[+-]\d{2}(:?\d{2})?)$/i.test(s);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  return new Date(hasZone || dateOnly ? s : `${s}Z`);
}

function fmt(value, options, fallback = "—") {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(d);
}

/** "Mon, 5 Oct, 2:11 pm" */
export const formatDateTime = (v) =>
  fmt(v, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

/** "5 Oct 2026, 2:11 pm" */
export const formatDateTimeLong = (v) =>
  fmt(v, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

/** "5 Oct 2026" */
export const formatDate = (v) => fmt(v, { day: "numeric", month: "short", year: "numeric" });

/** "5 Oct" */
export const formatShortDate = (v) => fmt(v, { day: "numeric", month: "short" });

/** "October 2026" */
export const formatMonthYear = (v) => fmt(v, { month: "long", year: "numeric" });

/** "2:11 pm" */
export const formatTime = (v) => fmt(v, { hour: "numeric", minute: "2-digit", hour12: true });

/** "Monday, 5 October 2026" — for "today" headings */
export const formatToday = (v = new Date()) =>
  fmt(v, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

/** Hour of day (0–23) in Nairobi — for "Good morning / afternoon / evening". */
export function nairobiHour(v = new Date()) {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" })
    .formatToParts(toDate(v)).find((p) => p.type === "hour")?.value;
  return Number(h ?? 0);
}

export function greeting(v = new Date()) {
  const h = nairobiHour(v);
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Kenya has no daylight saving, so EAT is always exactly UTC+3.
const EAT_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The moment today began in Nairobi (00:00 EAT) as a real Date — for "orders today". */
export function startOfTodayNairobi(now = new Date()) {
  const shifted = new Date(now.getTime() + EAT_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - EAT_MS);
}

/** "Just now", "5 mins ago", "2 hrs ago", "3 days ago" — same in every time zone. */
export function timeAgo(value) {
  const diff = Date.now() - toDate(value).getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

/** "2026-10-05" — the calendar day, in Nairobi, that a moment falls on. */
export function nairobiDayKey(value) {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + EAT_MS).toISOString().slice(0, 10);
}

/** The last `n` Nairobi day keys, oldest first, ending with today. */
export function lastDayKeys(n, now = new Date()) {
  const todayStart = startOfTodayNairobi(now).getTime();
  return Array.from({ length: n }, (_, i) => nairobiDayKey(todayStart - (n - 1 - i) * DAY_MS));
}

/** Format a day key like "2026-10-05" → "5 Oct" (no time zone shifting). */
export function formatDayKey(key, options = { day: "numeric", month: "short" }) {
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options }).format(new Date(Date.UTC(y, m - 1, d)));
}
