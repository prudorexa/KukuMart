// api/_lib/email.js
// Builds the HTML + text for each order email. Files starting with "_" are
// NOT exposed as routes by Vercel, so this is just a helper module.

const BRAND = "#C8290A";

export const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (n) => `KSh ${Number(n ?? 0).toLocaleString("en-KE")}`;
export const shortId = (id) => String(id).slice(0, 8).toUpperCase();

// Times in emails are always Nairobi time (EAT), whatever the server's own zone is.
// Timestamps with no zone info are read as UTC.
export function nairobiTime(value) {
  if (!value) return "";
  let s = String(value).trim().replace(" ", "T");
  if (!/(Z|[+-]\d{2}(:?\d{2})?)$/i.test(s) && !/^\d{4}-\d{2}-\d{2}$/.test(s)) s += "Z";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
}

const PAYMENT_LABEL = { mpesa: "M-Pesa", card: "Card / Bank", cash: "Cash on delivery" };

// One entry per order status. `rate: true` adds the "Rate your order" button.
const STAGES = {
  pending: {
    subject: (ref) => `We got your order #${ref} 🐔`,
    heading: "Thanks — we've received your order!",
    body: "We'll confirm it shortly and start preparing it. You can follow every step with the button below.",
    step: 1,
  },
  confirmed: {
    subject: (ref) => `Order #${ref} is confirmed ✅`,
    heading: "Your order is confirmed",
    body: "Good news — we've confirmed your order and will start preparing it.",
    step: 2,
  },
  preparing: {
    subject: (ref) => `We're preparing order #${ref} 🔥`,
    heading: "We're preparing your order",
    body: "Your chicken is being freshly prepared right now.",
    step: 3,
  },
  out_for_delivery: {
    subject: (ref) => `Order #${ref} is on its way 🛵`,
    heading: "Your order is out for delivery",
    body: "Our rider is on the way. Please keep your phone nearby — they may call you when they arrive.",
    step: 4,
  },
  delivered: {
    subject: (ref) => `Delivered! How did we do? (order #${ref})`,
    heading: "Your order has been delivered",
    body: "Enjoy your meal! It takes 20 seconds to tell us how we did, and it helps us get better.",
    step: 5,
    rate: true,
  },
  cancelled: {
    subject: (ref) => `Order #${ref} was cancelled`,
    heading: "Your order was cancelled",
    body: "If you didn't ask for this, or you'd like to order again, just reply to this email or message us on WhatsApp.",
    step: 0,
  },
};

export function hasEmailFor(status) {
  return Boolean(STAGES[status]);
}

function progressBar(step) {
  if (!step) return "";
  const labels = ["Received", "Confirmed", "Preparing", "On the way", "Delivered"];
  const cells = labels
    .map((l, i) => {
      const done = i + 1 <= step;
      return `<td align="center" style="padding:0 2px;">
        <div style="height:6px;border-radius:3px;background:${done ? BRAND : "#E5E7EB"};"></div>
        <div style="font-size:10px;color:${done ? "#111827" : "#9CA3AF"};margin-top:6px;font-weight:${i + 1 === step ? "700" : "400"};">${l}</div>
      </td>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 4px;"><tr>${cells}</tr></table>`;
}

function itemsTable(items) {
  const rows = (Array.isArray(items) ? items : [])
    .map(
      (it) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#111827;">${esc(it.name)} <span style="color:#9CA3AF;">× ${esc(it.quantity)}</span></td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#111827;white-space:nowrap;">${money((it.price ?? 0) * (it.quantity ?? 1))}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>`;
}

function button(href, label, primary = true) {
  const bg = primary ? BRAND : "#FFFFFF";
  const fg = primary ? "#FFFFFF" : BRAND;
  const border = primary ? BRAND : BRAND;
  return `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};border:2px solid ${border};text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px;margin:4px 6px 4px 0;">${esc(label)}</a>`;
}

/** Returns { subject, html, text } for the order's CURRENT status, or null. */
export function buildOrderEmail(order, siteUrl) {
  const stage = STAGES[order.status];
  if (!stage) return null;

  const ref = shortId(order.id);
  const trackUrl = `${siteUrl}/orders?id=${order.id}`;
  const rateUrl = `${siteUrl}/rate?id=${order.id}`;
  const firstName = esc(String(order.customer_name ?? "").trim().split(/\s+/)[0] || "there");

  const buttons =
    button(trackUrl, "Track my order") + (stage.rate ? button(rateUrl, "⭐ Rate your order", false) : "");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9FAFB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr><td style="background:${BRAND};padding:18px 24px;">
          <span style="font-size:20px;font-weight:800;color:#FFFFFF;">Kuku<span style="color:#FCA130;">Mart</span></span>
          <span style="font-size:11px;color:#FFD9CF;letter-spacing:1px;margin-left:8px;">FRESH CHICKEN · NAIROBI</span>
        </td></tr>
        <tr><td style="padding:28px 24px 8px;">
          <p style="margin:0 0 4px;font-size:14px;color:#6B7280;">Hi ${firstName},</p>
          <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#111827;">${esc(stage.heading)}</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#4B5563;">${esc(stage.body)}</p>
          ${progressBar(stage.step)}
        </td></tr>
        <tr><td style="padding:12px 24px 4px;">
          <p style="margin:12px 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;color:#6B7280;">ORDER #${esc(ref)}</p>
          ${itemsTable(order.items)}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">
            <tr><td style="font-size:13px;color:#6B7280;padding:3px 0;">Delivery fee</td><td align="right" style="font-size:13px;color:#6B7280;">${money(order.delivery_fee)}</td></tr>
            <tr><td style="font-size:15px;font-weight:700;color:#111827;padding:6px 0;">Total</td><td align="right" style="font-size:15px;font-weight:700;color:${BRAND};">${money(order.total)}</td></tr>
          </table>
          <p style="margin:10px 0 0;font-size:13px;color:#6B7280;line-height:1.6;">
            ${order.created_at ? `<strong style="color:#111827;">Placed:</strong> ${esc(nairobiTime(order.created_at))} (EAT)<br/>` : ""}
            <strong style="color:#111827;">Payment:</strong> ${esc(PAYMENT_LABEL[order.payment_type] ?? order.payment_type ?? "—")}<br/>
            <strong style="color:#111827;">Deliver to:</strong> ${esc(order.location ?? "—")}
          </p>
        </td></tr>
        <tr><td style="padding:20px 24px 28px;">${buttons}</td></tr>
        <tr><td style="background:#F9FAFB;padding:16px 24px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">Questions? Just reply to this email or message us on WhatsApp.<br/>KukuMart · Nairobi, Kenya</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Hi ${String(order.customer_name ?? "").trim().split(/\s+/)[0] || "there"},`,
    "",
    stage.heading,
    stage.body,
    "",
    `Order #${ref} — total ${money(order.total)}`,
    order.created_at ? `Placed: ${nairobiTime(order.created_at)} (EAT)` : "",
    `Track your order: ${trackUrl}`,
    stage.rate ? `Rate your order: ${rateUrl}` : "",
    "",
    "KukuMart · Nairobi, Kenya",
  ].join("\n");

  return { subject: stage.subject(ref), html, text };
}
