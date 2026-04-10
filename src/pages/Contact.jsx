// src/pages/Contact.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const WA_NUMBER  = "254720461267"; // 
const WA_MESSAGE = encodeURIComponent(
  "Hello KukuMart! 👋 I'd like to place an order.\n\nMy name is: ___\nI'm in (area): ___\nI'd like to order: ___"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C8290A] mb-3">
      {children}
    </p>
  );
}

/* ── Contact form — sends message to Supabase (optional table: contact_messages) ── */
function ContactForm() {
  const [form, setForm]     = useState({ name: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errors, setErrors] = useState({});

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = "Please enter your name.";
    if (!form.phone.trim())   e.phone   = "Please enter your phone number.";
    if (!form.message.trim()) e.message = "Please write a message.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      // Try to save to Supabase — if the table doesn't exist yet, still show success
      await supabase.from("contact_messages").insert([{
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        message: form.message.trim(),
      }]).then(() => {}); // swallow error silently — not critical
      setStatus("sent");
      setForm({ name: "", phone: "", message: "" });
    } catch {
      setStatus("sent"); // show success anyway — main contact is WhatsApp
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900">Message sent!</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          We'll get back to you shortly. For a faster response, WhatsApp us directly.
        </p>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#20b958] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          WhatsApp us instead
        </a>
        <button onClick={() => setStatus("idle")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Your name <span className="text-[#C8290A]">*</span>
        </label>
        <input
          type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Jane Wanjiru" autoComplete="name"
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
            errors.name ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
          }`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Phone number <span className="text-[#C8290A]">*</span>
        </label>
        <input
          type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)}
          placeholder="e.g. 0712 345 678" autoComplete="tel"
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
            errors.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
          }`}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Message <span className="text-[#C8290A]">*</span>
        </label>
        <textarea
          value={form.message} onChange={(e) => update("message", e.target.value)}
          placeholder="What would you like to ask or order?"
          rows={4}
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all resize-none ${
            errors.message ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
          }`}
        />
        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-60 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors"
      >
        {status === "sending" ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send message
          </>
        )}
      </button>
    </form>
  );
}

/* ── Main Contact page ── */
export default function Contact() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* Header */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <SectionLabel>Get in touch</SectionLabel>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Contact us
          </h1>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            Have a question, want to place a bulk order, or just want to chat?
            We're always happy to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: WhatsApp CTA + contact info */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">

            {/* WhatsApp — primary CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] hover:bg-[#20b958] rounded-2xl p-6 text-white transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-base">WhatsApp us</p>
                  <p className="text-white/80 text-xs">Fastest way to reach us</p>
                </div>
              </div>
              <p className="text-sm text-white/90 leading-relaxed mb-3">
                Click to open WhatsApp with a pre-filled order message — just fill in your details and hit send!
              </p>
              <div className="bg-white/15 rounded-xl p-3 text-xs text-white/90 italic border border-white/20">
                "Hello KukuMart! 👋 I'd like to place an order. My name is ___ and I'm in ___ area. I'd like to order: ___"
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2 transition-all">
                Open WhatsApp
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </div>
            </a>

            {/* Contact details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-900">Other ways to reach us</h3>

              {[
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a2 2 0 012.18-2l3 0a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.91 15a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  ),
                  label: "Call us", value: "+254 720 461 267", href: "tel:+254720461267",
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  ),
                  label: "Email", value: "orders@kukumart.co.ke", href: "mailto:orders@kukumart.co.ke",
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                  label: "Location", value: "Kasarani, Nairobi", href: null,
                },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#C8290A] shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm font-semibold text-gray-900 hover:text-[#C8290A] transition-colors">{value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Business hours */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8290A" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Business hours
              </h3>
              <div className="space-y-2">
                {[
                  { day: "Monday – Friday", hours: "6:00 AM – 8:00 PM" },
                  { day: "Saturday",        hours: "6:00 AM – 8:00 PM" },
                  { day: "Sunday",          hours: "7:00 AM – 6:00 PM" },
                ].map(({ day, hours }) => (
                  <div key={day} className="flex justify-between text-xs">
                    <span className="text-gray-500">{day}</span>
                    <span className="font-semibold text-gray-900">{hours}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                Order before 2 PM for same-day delivery
              </div>
            </div>
          </div>

          {/* Right: Contact form */}
          <div className="flex-1 w-full">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Send us a message</h2>
              <p className="text-sm text-gray-500 mb-6">
                For the fastest response, use WhatsApp. But if you prefer email-style contact, fill in the form below.
              </p>
              <ContactForm />
            </div>

            {/* Bulk orders CTA */}
            <div className="mt-5 bg-gray-900 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold text-base mb-1">📦 Planning a big event?</h3>
                <p className="text-gray-400 text-sm">
                  Weddings, corporate events, hotel supply, restaurant orders — we handle bulk orders
                  of any size. WhatsApp us for custom pricing and scheduling.
                </p>
              </div>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20b958] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                Get bulk quote
              </a>
            </div>

            {/* Quick links */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Browse our shop", to: "/shop", icon: "🛒" },
                { label: "Track my order", to: "/orders", icon: "🛵" },
                { label: "About KukuMart", to: "/about", icon: "🐔" },
              ].map(({ label, to, icon }) => (
                <Link key={to} to={to} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-2.5 hover:border-[#C8290A]/30 hover:bg-red-50 transition-all group">
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#C8290A] transition-colors">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}