// src/pages/OrderSuccess.jsx
// Shown after a successful order is placed.
// URL: /order-success?id=ORDER_UUID&payment=mpesa|card|cash

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const WA_NUMBER = "254700000000";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId    = searchParams.get("id");
  const paymentType = searchParams.get("payment");

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderId) { setLoading(false); return; }

    supabase
      .from("orders")
      .select("id, customer_name, total, delivery_fee, payment_type, status, location, created_at")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId]);

  const waText = encodeURIComponent(
    `Hello KukuMart! 👋 I just placed order #${orderId?.slice(0, 8).toUpperCase() ?? ""}. My name is ${order?.customer_name ?? ""}. I'd like to confirm my order details.`
  );

  const PaymentInstructions = () => {
    if (paymentType === "mpesa") return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
          <span className="text-base">📱</span> M-Pesa payment
        </h3>
        <ol className="text-xs text-green-700 space-y-1.5 list-decimal list-inside">
          <li>Check your phone — you should have received an STK push prompt.</li>
          <li>Enter your M-Pesa PIN to confirm payment.</li>
          <li>You'll get an SMS confirmation from M-Pesa once paid.</li>
          <li>We'll confirm your order and start preparing immediately.</li>
        </ol>
        <p className="text-xs text-green-600 mt-3 font-medium">
          Didn't receive the prompt? WhatsApp us and we'll send it again.
        </p>
      </div>
    );

    if (paymentType === "cash") return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
          <span className="text-base">💵</span> Cash on delivery
        </h3>
        <p className="text-xs text-amber-700">
          Please have the exact amount of{" "}
          <strong>KSh {order?.total?.toLocaleString()}</strong> ready when our
          rider arrives. Payment is collected at your door.
        </p>
      </div>
    );

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
          <span className="text-base">💳</span> Card / bank payment
        </h3>
        <p className="text-xs text-blue-700">
          You'll receive a Pesapal payment link via WhatsApp or SMS shortly.
          Complete payment to confirm your order.
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">

        {/* Success animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" style={{ animationDuration: "1s", animationIterationCount: 3 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order placed! 🎉</h1>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Thank you, <strong>{order?.customer_name ?? "valued customer"}</strong>!
            Your fresh chicken is on its way.
          </p>
        </div>

        {/* Order reference card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-medium">Order reference</p>
              <p className="text-base font-bold text-gray-900 font-mono tracking-wide">
                #{orderId?.slice(0, 8).toUpperCase() ?? "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Total paid</p>
              <p className="text-base font-bold text-[#C8290A]">
                KSh {order?.total?.toLocaleString() ?? "—"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: "Delivery to", value: order?.location ?? "—" },
              { label: "Payment",     value: order?.payment_type === "mpesa" ? "M-Pesa" : order?.payment_type === "cash" ? "Cash on delivery" : "Card / bank" },
              { label: "Status",      value: "Pending confirmation ⏳" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment instructions */}
        <div className="mb-4">
          <PaymentInstructions />
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">What happens next?</h3>
          <div className="space-y-3">
            {[
              { icon: "✅", text: "We confirm your order (within 15 minutes)" },
              { icon: "🐔", text: "We prepare your fresh chicken" },
              { icon: "🛵", text: "Our rider picks up and heads your way" },
              { icon: "🏠", text: "Delivered to your door!" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-base w-6 shrink-0">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b958] text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Chat with us on WhatsApp
          </a>

          <Link
            to="/orders"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
            Track my order
          </Link>

          <Link
            to="/shop"
            className="text-center text-sm text-gray-400 hover:text-[#C8290A] transition-colors py-2"
          >
            Continue shopping →
          </Link>
        </div>
      </div>
    </div>
  );
}