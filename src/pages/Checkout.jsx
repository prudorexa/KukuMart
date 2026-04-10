// src/pages/Checkout.jsx
// Full checkout flow:
//   Step 1 — Customer details (name, phone)
//   Step 2 — Delivery location (Google Maps pin drop)
//   Step 3 — Payment method (M-Pesa / Card / Cash on delivery)
//   Step 4 — Review & place order (saved to Supabase)
//
// ─── SETUP NEEDED ───────────────────────────────────────────────
// 1. Get a Google Maps JavaScript API key from console.cloud.google.com
//    Enable: "Maps JavaScript API" and "Geocoding API"
// 2. Add to your .env:  VITE_GOOGLE_MAPS_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXX
// ────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  useCartStore,
  selectCartTotal,
} from "../store/cartStore";

/* ─────────────────────────────────────
   DELIVERY ZONE PRICING
   (based on straight-line distance from city centre)
───────────────────────────────────── */
const NAIROBI_CENTER = { lat: -1.286389, lng: 36.817223 };

const DELIVERY_ZONES = [
  { label: "CBD & Town",                  maxKm: 5,   fee: 150 },
  { label: "Westlands / Parklands",       maxKm: 10,  fee: 200 },
  { label: "South B / South C / Lang'ata",maxKm: 15,  fee: 200 },
  { label: "Eastlands (Umoja, Donholm…)", maxKm: 18,  fee: 200 },
  { label: "Kitengela / Rongai / Ngong",  maxKm: 40,  fee: 300 },
  { label: "Outside Nairobi",             maxKm: 9999, fee: 500 },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDeliveryZone(lat, lng) {
  const km = haversineKm(NAIROBI_CENTER.lat, NAIROBI_CENTER.lng, lat, lng);
  return DELIVERY_ZONES.find((z) => km <= z.maxKm) ?? DELIVERY_ZONES.at(-1);
}

/* ─────────────────────────────────────
   GOOGLE MAPS LOADER
   Loads the Maps JS SDK once, returns ready state.
───────────────────────────────────── */
let mapsPromise = null;
function loadGoogleMaps() {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) {
      reject(new Error("VITE_GOOGLE_MAPS_KEY not set in .env"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsPromise;
}

/* ─────────────────────────────────────
   MAP COMPONENT
───────────────────────────────────── */
function DeliveryMap({ onLocationSelect, selectedLocation }) {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const initMap = useCallback(async () => {
    try {
      await loadGoogleMaps();
      if (!mapRef.current) return;

      const center = selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : NAIROBI_CENTER;

      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });

      // Drop a marker if we already have a location
      if (selectedLocation) {
        placeMarker(center);
      }

      mapObj.current.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        placeMarker({ lat, lng });
        reverseGeocode(lat, lng);
      });

      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []); // eslint-disable-line

  function placeMarker(position) {
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position,
      map: mapObj.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: "#C8290A",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
        scale: 10,
      },
      animation: window.google.maps.Animation.DROP,
    });
  }

  function reverseGeocode(lat, lng) {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const zone = getDeliveryZone(lat, lng);
        onLocationSelect({
          lat,
          lng,
          address: results[0].formatted_address,
          zone,
        });
      } else {
        const zone = getDeliveryZone(lat, lng);
        onLocationSelect({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, zone });
      }
    });
  }

  useEffect(() => {
    initMap();
  }, [initMap]);

  if (status === "error") {
    return (
      <div className="w-full h-64 rounded-2xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-3xl">🗺️</span>
        <p className="text-sm font-semibold text-gray-700">Map unavailable</p>
        <p className="text-xs text-gray-500 max-w-xs">
          {errorMsg || "Add VITE_GOOGLE_MAPS_KEY to your .env file to enable map delivery."}
        </p>
        <p className="text-xs text-gray-400">
          You can still type your address below and we'll confirm delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200">
      {status === "loading" && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading map…</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-72 sm:h-80" />
      <div className="absolute top-3 left-3 right-3 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs text-gray-600 font-medium text-center shadow-sm">
          📍 Tap anywhere on the map to drop your delivery pin
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────── */
const STEPS = ["Details", "Location", "Payment", "Review"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                done   ? "bg-[#C8290A] text-white" :
                active ? "bg-[#C8290A] text-white ring-4 ring-[#C8290A]/20" :
                         "bg-gray-100 text-gray-400"
              }`}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-[#C8290A]" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 sm:w-16 h-0.5 mx-1 mb-4 transition-colors duration-200 ${i < current ? "bg-[#C8290A]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────
   PAYMENT METHOD CARD
───────────────────────────────────── */
function PaymentOption({ id, selected, onSelect, icon, title, description, badge }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected
          ? "border-[#C8290A] bg-red-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
        selected ? "bg-white" : "bg-gray-50"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold ${selected ? "text-[#C8290A]" : "text-gray-900"}`}>
            {title}
          </p>
          {badge && (
            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
        selected ? "border-[#C8290A] bg-[#C8290A]" : "border-gray-300"
      }`}>
        {selected && (
          <div className="w-2 h-2 rounded-full bg-white" />
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────
   ORDER REVIEW ROW
───────────────────────────────────── */
function ReviewRow({ label, value, bold, red }) {
  return (
    <div className={`flex justify-between py-2 ${bold ? "border-t border-gray-100 mt-1 pt-3" : ""}`}>
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-500"}`}>{label}</span>
      <span className={`text-sm font-semibold ${red ? "text-[#C8290A]" : bold ? "text-gray-900 text-base" : "text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────
   FORM FIELD
───────────────────────────────────── */
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-[#C8290A] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN CHECKOUT PAGE
───────────────────────────────────── */
const CAT_EMOJI = {
  broiler_live:  "🐓",
  kienyeji_live: "🐔",
  slaughtered:   "🥩",
  fried_pieces:  "🍗",
  fried_whole:   "🍖",
};

export default function Checkout() {
  const navigate    = useNavigate();
  const items       = useCartStore((s) => s.items);
  const subtotal    = useCartStore(selectCartTotal);
  const clearCart   = useCartStore((s) => s.clearCart);

  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  // Step 1 — customer details
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2 — delivery location
  const [location, setLocation]           = useState(null); // { lat, lng, address, zone }
  const [manualAddress, setManualAddress] = useState("");

  // Step 3 — payment
  const [paymentMethod, setPaymentMethod] = useState("mpesa");

  // If cart is empty, redirect
  useEffect(() => {
    if (items.length === 0) navigate("/cart");
    window.scrollTo(0, 0);
  }, []); // eslint-disable-line

  const deliveryFee = location?.zone?.fee ?? 200;
  const grandTotal  = subtotal + deliveryFee;

  /* ── Validation ── */
  function validateStep(s) {
    const e = {};
    if (s === 0) {
      if (!name.trim())  e.name  = "Please enter your full name.";
      if (!phone.trim()) e.phone = "Please enter your phone number.";
      else if (!/^(?:0|\+254|254)[17]\d{8}$/.test(phone.replace(/\s/g, "")))
        e.phone = "Enter a valid Kenyan phone number (e.g. 0712 345678).";
    }
    if (s === 1) {
      if (!location && !manualAddress.trim())
        e.location = "Please pin your location on the map or type your address.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
    setErrors({});
  }

  /* ── Submit order to Supabase ── */
  async function placeOrder() {
    setLoading(true);
    try {
      const orderPayload = {
        customer_name: name.trim(),
        phone:         phone.trim().replace(/\s/g, ""),
        location:      location?.address ?? manualAddress.trim(),
        lat:           location?.lat ?? null,
        lng:           location?.lng ?? null,
        delivery_zone: location?.zone?.label ?? "Unknown",
        items:         items,           // stored as JSONB in Supabase
        subtotal,
        delivery_fee:  deliveryFee,
        total:         grandTotal,
        payment_type:  paymentMethod,
        paid:          paymentMethod === "cash" ? false : false, // M-Pesa confirmed separately
        status:        "pending",
        notes:         notes.trim() || null,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select("id")
        .single();

      if (error) throw error;

      // Clear cart and go to success
      clearCart();
      navigate(`/order-success?id=${data.id}&payment=${paymentMethod}`);
    } catch (err) {
      console.error("Order error:", err);
      setErrors({ submit: err.message ?? "Failed to place order. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  /* ── Step panels ── */

  const Step0_Details = () => (
    <div className="flex flex-col gap-5">
      <Field label="Full name" required error={errors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Wanjiru"
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
            errors.name ? "border-red-400" : "border-gray-200"
          }`}
        />
      </Field>

      <Field label="Phone number" required error={errors.phone}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0712 345 678"
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
            errors.phone ? "border-red-400" : "border-gray-200"
          }`}
        />
        <p className="text-xs text-gray-400 mt-1">Used for delivery coordination and M-Pesa payment.</p>
      </Field>

      <Field label="Delivery notes (optional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Blue gate, call when nearby, apartment 3B…"
          rows={3}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all resize-none"
        />
      </Field>
    </div>
  );

  const Step1_Location = () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-gray-600 mb-3">
          Tap on the map to drop your delivery pin. We'll calculate your delivery fee automatically.
        </p>
        <DeliveryMap onLocationSelect={setLocation} selectedLocation={location} />
      </div>

      {/* Selected location display */}
      {location && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-lg shrink-0">📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Location selected</p>
            <p className="text-xs text-green-700 mt-0.5 overflow-wrap-break-word">{location.address}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-semibold text-green-800">
                Zone: {location.zone.label}
              </span>
              <span className="text-xs font-bold text-[#C8290A]">
                Delivery fee: KSh {location.zone.fee}
              </span>
            </div>
          </div>
          <button onClick={() => setLocation(null)} className="text-xs text-gray-400 hover:text-red-500 shrink-0">
            Clear
          </button>
        </div>
      )}

      {/* Manual address fallback */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          Or type your address manually
        </p>
        <input
          type="text"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="e.g. Umoja Estate, Stage 5, Nairobi"
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"
        />
      </div>

      {errors.location && (
        <p className="text-xs text-red-500">{errors.location}</p>
      )}

      {/* Zones reference */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 border-b border-gray-100">
          Delivery zones & fees
        </p>
        {DELIVERY_ZONES.slice(0, 5).map((z) => (
          <div key={z.label} className={`flex justify-between px-4 py-2 text-xs border-b border-gray-100 last:border-0 ${
            location?.zone?.label === z.label ? "bg-red-50" : ""
          }`}>
            <span className="text-gray-600">{z.label}</span>
            <span className="font-bold text-[#C8290A]">KSh {z.fee}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const Step2_Payment = () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600 mb-1">
        Choose how you'd like to pay for your order.
      </p>
      <PaymentOption
        id="mpesa"
        selected={paymentMethod === "mpesa"}
        onSelect={setPaymentMethod}
        icon="📱"
        title="M-Pesa"
        description="You'll receive an STK push to your phone after placing the order. Fast & secure."
        badge="Most popular"
      />
      <PaymentOption
        id="card"
        selected={paymentMethod === "card"}
        onSelect={setPaymentMethod}
        icon="💳"
        title="Card / Bank transfer"
        description="Pay via Pesapal — Visa, Mastercard, or bank transfer accepted."
      />
      <PaymentOption
        id="cash"
        selected={paymentMethod === "cash"}
        onSelect={setPaymentMethod}
        icon="💵"
        title="Cash on delivery"
        description="Pay cash when your order arrives at your door. No advance payment needed."
      />

      {paymentMethod === "mpesa" && (
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
          <p className="font-semibold mb-1">💡 How M-Pesa works:</p>
          <p>After placing your order, you'll receive an M-Pesa STK push prompt on <strong>{phone || "your phone"}</strong>. Enter your PIN to confirm payment. Your order ships once confirmed.</p>
        </div>
      )}
    </div>
  );

  const Step3_Review = () => (
    <div className="flex flex-col gap-5">
      {/* Items */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">
          Your items ({items.length})
        </p>
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{CAT_EMOJI[item.category] ?? "🐔"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 shrink-0">
                KSh {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery & payment details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <ReviewRow label="Customer name" value={name} />
        <ReviewRow label="Phone" value={phone} />
        <ReviewRow label="Delivery to" value={location?.address ?? manualAddress} />
        <ReviewRow label="Zone" value={location?.zone?.label ?? "—"} />
        <ReviewRow label="Payment method" value={
          paymentMethod === "mpesa" ? "M-Pesa" :
          paymentMethod === "card"  ? "Card / Bank transfer" :
          "Cash on delivery"
        } />
        {notes && <ReviewRow label="Notes" value={notes} />}
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <ReviewRow label="Subtotal"     value={`KSh ${subtotal.toLocaleString()}`} />
        <ReviewRow label="Delivery fee" value={`KSh ${deliveryFee.toLocaleString()}`} />
        <ReviewRow label="Total"        value={`KSh ${grandTotal.toLocaleString()}`} bold red />
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}
    </div>
  );

  const stepContent = [
    <Step0_Details key="0" />,
    <Step1_Location key="1" />,
    <Step2_Payment key="2" />,
    <Step3_Review key="3" />,
  ];

  const stepTitles = [
    "Your details",
    "Delivery location",
    "Payment method",
    "Review your order",
  ];

  const stepSubtitles = [
    "We need your name and phone for delivery coordination.",
    "Show us where to deliver your chicken.",
    "Choose how you want to pay.",
    "Everything look good? Place your order!",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#C8290A] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/cart" className="hover:text-[#C8290A] transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Checkout</span>
          </nav>
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Main */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Step heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{stepTitles[step]}</h1>
          <p className="text-sm text-gray-500 mt-1">{stepSubtitles[step]}</p>
        </div>

        {/* Step content card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-5">
          {stepContent[step]}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white font-bold text-sm py-3 rounded-xl transition-colors duration-150"
            >
              Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            <button
              onClick={placeOrder}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors duration-150"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing order…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Place order — KSh {grandTotal.toLocaleString()}
                </>
              )}
            </button>
          )}
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Secure checkout — your information is never shared
        </p>
      </div>
    </div>
  );
}