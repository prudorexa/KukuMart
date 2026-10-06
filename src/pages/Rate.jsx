// src/pages/Rate.jsx   →  /rate?id=<order id>
// Opened from the "Rate your order" button in the delivery email (works signed out too).
// Reads the order with the secure track_order() function and saves with submit_review(),
// which only accepts ratings for DELIVERED orders, once per order.

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fetchTrackedOrder } from "../lib/orderApi";
import { formatDateTimeLong } from "../lib/time";
import StarRating from "../components/StarRating";

const ASPECTS = [
  { key: "quality",  label: "Chicken quality", hint: "Freshness, cut, taste" },
  { key: "delivery", label: "Delivery",        hint: "Speed and care" },
  { key: "service",  label: "Service",         hint: "Friendliness and communication" },
];
const MAX_COMMENT = 1000;

function friendlyError(err) {
  const m = String(err?.message ?? err ?? "").toLowerCase();
  if (m.includes("already_reviewed"))    return "This order has already been rated — thank you!";
  if (m.includes("order_not_delivered")) return "You can rate this order once it has been delivered.";
  if (m.includes("order_not_found"))     return "We couldn't find that order.";
  if (m.includes("invalid_rating"))      return "Please choose between 1 and 5 stars.";
  if (m.includes("could not find the function") || m.includes("submit_review") && m.includes("schema"))
    return "Ratings aren't switched on yet. Please try again later.";
  if (m.includes("failed to fetch") || m.includes("network")) return "No connection. Check your internet and try again.";
  return "Something went wrong saving your rating. Please try again.";
}

function Shell({ children }) {
  return (
    <div className="bg-gray-50 min-h-[70vh]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-14">{children}</div>
    </div>
  );
}

function Message({ emoji, title, text, action }) {
  return (
    <Shell>
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">{emoji}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{text}</p>
        {action}
      </div>
    </Shell>
  );
}

const linkBtn = "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#C8290A] hover:bg-[#a82008] text-white text-sm font-semibold transition-colors";

export default function Rate() {
  const [params] = useSearchParams();
  const orderId = params.get("id");

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [overall, setOverall] = useState(0);
  const [aspects, setAspects] = useState({ quality: 0, delivery: 0, service: 0 });
  const [comment, setComment] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  useEffect(() => {
    document.title = "Rate your order — KukuMart";
    window.scrollTo(0, 0);
    if (!orderId) return;
    let cancelled = false;
    fetchTrackedOrder(orderId)
      .then((o) => { if (!cancelled) setOrder(o); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  async function submit(e) {
    e.preventDefault();
    if (!overall) { setError("Please tap the stars to give an overall rating."); return; }
    setSaving(true); setError("");
    const { error: rpcErr } = await supabase.rpc("submit_review", {
      p_order_id: orderId,
      p_rating:   overall,
      p_quality:  aspects.quality  || null,
      p_delivery: aspects.delivery || null,
      p_service:  aspects.service  || null,
      p_comment:  comment.trim() || null,
    });
    setSaving(false);
    if (rpcErr) {
      if (String(rpcErr.message).includes("already_reviewed")) setDone(true);
      setError(friendlyError(rpcErr));
      return;
    }
    setDone(true);
  }

  if (!orderId) {
    return <Message emoji="🔗" title="This rating link is incomplete"
      text="Please open the link from your delivery email, or find the order in your account."
      action={<Link to="/orders" className={linkBtn}>Go to my orders</Link>} />;
  }
  if (loading) {
    return <Shell><div className="h-72 bg-white border border-gray-200 rounded-2xl animate-pulse" /></Shell>;
  }
  if (!order) {
    return <Message emoji="🔍" title="We couldn't find that order"
      text="The link may be wrong or incomplete. Check the email we sent you, or message us and we'll help."
      action={<Link to="/contact" className={linkBtn}>Contact us</Link>} />;
  }

  const ref = String(order.id).slice(0, 8).toUpperCase();

  if (done || order.reviewed) {
    return <Message emoji="🙏" title="Thank you for your feedback!"
      text={done && overall >= 4
        ? "We're so glad you enjoyed it. Your rating helps other customers and keeps our team motivated."
        : "Your rating has been recorded. We read every comment and use it to get better."}
      action={<div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/shop" className={linkBtn}>Order again</Link>
        <Link to="/" className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Back to home</Link>
      </div>} />;
  }
  if (order.status !== "delivered") {
    return <Message emoji="🛵" title="Not delivered yet"
      text={`Order #${ref} hasn't been delivered yet. You'll be able to rate it as soon as it arrives — we'll email you.`}
      action={<Link to={`/orders?id=${order.id}`} className={linkBtn}>Track my order</Link>} />;
  }

  return (
    <Shell>
      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8" noValidate>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#C8290A] mb-2">Order #{ref}</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">How did we do?</h1>
        <p className="text-sm text-gray-500 mb-6">
          Placed {formatDateTimeLong(order.created_at)}. It takes under a minute and helps us a lot.
        </p>

        <div className="mb-6 pb-6 border-b border-gray-100">
          <p id="overall-label" className="text-sm font-semibold text-gray-900 mb-3">Overall experience</p>
          <StarRating value={overall} onChange={setOverall} size={38} label="Overall experience" showWord />
        </div>

        <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">
            Rate the details <span className="text-xs font-normal text-gray-400">optional</span>
          </p>
          {ASPECTS.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-800">{a.label}</p>
                <p className="text-xs text-gray-400">{a.hint}</p>
              </div>
              <StarRating value={aspects[a.key]} size={24} label={a.label}
                onChange={(v) => setAspects((s) => ({ ...s, [a.key]: v }))} />
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label htmlFor="comment" className="block text-sm font-semibold text-gray-900 mb-2">
            Anything else you'd like to tell us? <span className="text-xs font-normal text-gray-400">optional</span>
          </label>
          <textarea id="comment" rows={4} maxLength={MAX_COMMENT} value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What was great? What could be better?"
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A]" />
          <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/{MAX_COMMENT}</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">{error}</div>
        )}

        <button type="submit" disabled={saving}
          className="w-full py-3.5 rounded-xl bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-60 text-white font-semibold text-sm transition-colors">
          {saving ? "Sending…" : "Submit rating"}
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-3">
          Your first name and area may be shown with your rating. We never show your phone or email.
        </p>
      </form>
    </Shell>
  );
}
