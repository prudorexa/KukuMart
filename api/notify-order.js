// api/notify-order.js  →  POST /api/notify-order   body: { "order_id": "<uuid>" }
//
// Emails the customer about the order's CURRENT status.
// Safe by design:
//   • the browser only sends an order id — the recipient, content and status
//     all come from the database, never from the request;
//   • each status is emailed at most once (orders.last_emailed_status);
//   • the service-role key and email API key exist only on the server.
//
// Vercel env vars needed:
//   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Project Settings → API → service_role)
//   BREVO_API_KEY               (Brevo → SMTP & API → API keys)
//   EMAIL_FROM                  (a sender address verified in Brevo)
// Optional: EMAIL_FROM_NAME (default "KukuMart"), SITE_URL, SUPABASE_URL

import { createClient } from "@supabase/supabase-js";
import { buildOrderEmail } from "./_lib/email.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const orderId = body?.order_id;
  if (typeof orderId !== "string" || !UUID.test(orderId)) {
    return res.status(400).json({ error: "invalid_order_id" });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const brevoKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!url || !serviceKey || !brevoKey || !from) {
    console.error("notify-order: missing env vars", {
      url: !!url, serviceKey: !!serviceKey, brevoKey: !!brevoKey, from: !!from,
    });
    return res.status(500).json({ error: "server_not_configured" });
  }

  const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/+$/, "");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: order, error: readErr } = await supabase
    .from("orders").select("*").eq("id", orderId).maybeSingle();
  if (readErr) {
    console.error("notify-order: read failed", readErr.message);
    return res.status(500).json({ error: "read_failed" });
  }
  if (!order) return res.status(404).json({ error: "order_not_found" });

  const to = String(order.email ?? "").trim();
  if (!EMAIL.test(to)) return res.status(200).json({ skipped: "no_email" });

  const mail = buildOrderEmail(order, siteUrl);
  if (!mail) return res.status(200).json({ skipped: "no_template_for_status" });

  // Claim this status atomically so two requests can't both send it.
  const previous = order.last_emailed_status ?? null;
  const { data: claimed, error: claimErr } = await supabase
    .from("orders")
    .update({ last_emailed_status: order.status })
    .eq("id", order.id)
    .or(`last_emailed_status.is.null,last_emailed_status.neq.${order.status}`)
    .select("id");
  if (claimErr) {
    console.error("notify-order: claim failed", claimErr.message);
    return res.status(500).json({ error: "claim_failed" });
  }
  if (!claimed || claimed.length === 0) {
    return res.status(200).json({ skipped: "already_sent", status: order.status });
  }

  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: process.env.EMAIL_FROM_NAME || "KukuMart", email: from },
        to: [{ email: to, name: order.customer_name || undefined }],
        subject: mail.subject,
        htmlContent: mail.html,
        textContent: mail.text,
      }),
    });
    if (!r.ok) throw new Error(`brevo ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return res.status(200).json({ sent: true, status: order.status });
  } catch (err) {
    console.error("notify-order: send failed", err.message);
    // Release the claim so the next call can retry this status.
    await supabase.from("orders").update({ last_emailed_status: previous }).eq("id", order.id);
    return res.status(502).json({ error: "send_failed" });
  }
}
