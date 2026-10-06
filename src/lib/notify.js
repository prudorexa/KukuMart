// src/lib/notify.js
// Asks the server to email the customer about this order's current status.
// Fire-and-forget: a failed email must never block checkout or an admin update.
// The server decides who gets the email and what it says (from the database),
// and sends each status at most once, so calling this twice is harmless.

export function notifyOrder(orderId) {
  if (!orderId) return;
  try {
    fetch("/api/notify-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
      keepalive: true, // still completes if the page navigates away
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
