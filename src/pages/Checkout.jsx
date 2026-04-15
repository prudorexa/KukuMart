// src/pages/Checkout.jsx
// FIXES:
//  ✅ Input focus bug — step panels are now proper named components defined
//     OUTSIDE the Checkout function, so React never unmounts/remounts them on re-render
//  ✅ Map centered on Kasarani (KukuMart shop) instead of CBD
//  ✅ Delivery fees calculated from Kasarani — realistic & fair prices
//  ✅ Places Autocomplete search bar on the map so users can search their area
//  ✅ Green marker shows shop location; red marker shows customer pin
//  ✅ Graceful fallback if no Google Maps API key is configured

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCartStore, selectCartTotal } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

/* ─────────────────────────────────────
   KASARANI — KukuMart shop location
───────────────────────────────────── */
const KASARANI = { lat: -1.2209, lng: 36.8976 };

/* ─────────────────────────────────────
   DELIVERY ZONES  (distance from Kasarani)
───────────────────────────────────── */
const DELIVERY_ZONES = [
  { label: "Kasarani & immediate area",    maxKm: 3,    fee: 100 },
  { label: "Roysambu, Thika Rd corridor",  maxKm: 7,    fee: 150 },
  { label: "CBD, Westlands, Parklands",    maxKm: 12,   fee: 200 },
  { label: "Eastlands (Umoja, Donholm…)",  maxKm: 18,   fee: 200 },
  { label: "South B, South C, Lang'ata",   maxKm: 22,   fee: 250 },
  { label: "Ngong, Rongai, Karen",         maxKm: 32,   fee: 300 },
  { label: "Kitengela, Athi River",        maxKm: 45,   fee: 350 },
  { label: "Outside Nairobi",              maxKm: 9999, fee: 500 },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
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
  const km = haversineKm(KASARANI.lat, KASARANI.lng, lat, lng);
  return DELIVERY_ZONES.find((z) => km <= z.maxKm) ?? DELIVERY_ZONES[DELIVERY_ZONES.length - 1];
}

/* ─────────────────────────────────────
   GOOGLE MAPS LOADER
───────────────────────────────────── */
let mapsPromise = null;
function loadGoogleMaps() {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) { reject(new Error("no_key")); return; }
    const script   = document.createElement("script");
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async   = true;
    script.defer   = true;
    script.onload  = resolve;
    script.onerror = () => { mapsPromise = null; reject(new Error("Failed to load Google Maps")); };
    document.head.appendChild(script);
  });
  return mapsPromise;
}

/* ─────────────────────────────────────
   DELIVERY MAP
   Top-level component — never recreated inside another render
───────────────────────────────────── */
function DeliveryMap({ onLocationSelect, selectedLocation }) {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const markerRef = useRef(null);
  const searchRef = useRef(null);
  const [status,   setStatus]   = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const placeMarker = useCallback((pos) => {
    if (!mapObj.current) return;
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position:  pos,
      map:       mapObj.current,
      animation: window.google.maps.Animation.DROP,
      icon: {
        path:        window.google.maps.SymbolPath.CIRCLE,
        fillColor:   "#C8290A",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
        scale:       11,
      },
    });
  }, []);

  const reverseGeocode = useCallback((lat, lng, callback) => {
    if (!window.google?.maps) return;
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, st) => {
      const address = st === "OK" && results?.[0]
        ? results[0].formatted_address
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      callback({ lat, lng, address, zone: getDeliveryZone(lat, lng) });
    });
  }, []);

  const initMap = useCallback(async () => {
    try {
      await loadGoogleMaps();
      if (!mapRef.current) return;

      const center = selectedLocation
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : KASARANI;

      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center, zoom: selectedLocation ? 15 : 13,
        disableDefaultUI: false, zoomControl: true,
        streetViewControl: false, fullscreenControl: false, mapTypeControl: false,
        styles: [
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          { featureType: "transit",      stylers: [{ visibility: "off" }] },
        ],
      });

      // Shop marker (green)
      new window.google.maps.Marker({
        position: KASARANI, map: mapObj.current, title: "KukuMart — Kasarani",
        icon: { path: window.google.maps.SymbolPath.CIRCLE, fillColor: "#16A34A", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 9 },
      });

      if (selectedLocation) placeMarker({ lat: selectedLocation.lat, lng: selectedLocation.lng });

      mapObj.current.addListener("click", (e) => {
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        placeMarker({ lat, lng });
        reverseGeocode(lat, lng, onLocationSelect);
      });

      // Search autocomplete
      if (searchRef.current) {
        const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
          componentRestrictions: { country: "ke" },
          fields: ["geometry", "formatted_address", "name"],
        });
        ac.bindTo("bounds", mapObj.current);
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.geometry?.location) return;
          const lat = place.geometry.location.lat(), lng = place.geometry.location.lng();
          mapObj.current.panTo({ lat, lng });
          mapObj.current.setZoom(15);
          placeMarker({ lat, lng });
          onLocationSelect({ lat, lng, address: place.formatted_address ?? place.name, zone: getDeliveryZone(lat, lng) });
        });
      }
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []); // eslint-disable-line

  useEffect(() => { initMap(); }, [initMap]);

  if (status === "error") {
    return (
      <div className="w-full rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-sm font-semibold text-amber-800 mb-1">Map not configured</p>
        <p className="text-xs text-amber-700 max-w-xs mx-auto mb-2">
          {errorMsg === "no_key"
            ? "Add VITE_GOOGLE_MAPS_KEY to your .env to enable the map."
            : errorMsg}
        </p>
        <p className="text-xs text-amber-600">Type your address in the field below — we'll confirm the delivery fee when we call you.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200">
      {/* Search box */}
      <div className="absolute top-3 left-3 right-3 z-10">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search your area, e.g. Umoja Estate…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/95 border border-gray-200 rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A]"
          />
        </div>
      </div>
      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#C8290A] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading map…</p>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "320px" }} />
      {/* Hint strip */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
        <span className="bg-black/50 text-white text-xs rounded-full px-3 py-1">
          📍 Tap the map to set your delivery pin
        </span>
      </div>
      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 rounded-xl px-3 py-1.5 shadow text-xs text-gray-700">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />KukuMart</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#C8290A] inline-block" />You</span>
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
        const done = i < current, active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                done ? "bg-[#C8290A] text-white" : active ? "bg-[#C8290A] text-white ring-4 ring-[#C8290A]/20" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-[#C8290A]" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 sm:w-16 h-0.5 mx-1 mb-4 transition-colors ${i < current ? "bg-[#C8290A]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────
   PAYMENT OPTION CARD
───────────────────────────────────── */
function PaymentOption({ id, selected, onSelect, icon, title, description, badge }) {
  return (
    <button type="button" onClick={() => onSelect(id)}
      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
        selected ? "border-[#C8290A] bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${selected ? "bg-white" : "bg-gray-50"}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-bold ${selected ? "text-[#C8290A]" : "text-gray-900"}`}>{title}</p>
          {badge && <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selected ? "border-[#C8290A] bg-[#C8290A]" : "border-gray-300"}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

function ReviewRow({ label, value, bold, red }) {
  return (
    <div className={`flex justify-between py-2 ${bold ? "border-t border-gray-100 mt-1 pt-3" : ""}`}>
      <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-500"}`}>{label}</span>
      <span className={`text-sm font-semibold text-right max-w-[60%] break-word ${red ? "text-[#C8290A]" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────
   STEP PANELS  ← all defined as NAMED components OUTSIDE Checkout
                  This is the key fix for the input focus bug.
                  React will NOT remount these between renders.
───────────────────────────────────── */

function Step0Details({ name, setName, phone, setPhone, notes, setNotes, errors }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Full name <span className="text-[#C8290A]">*</span>
        </label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Wanjiru" autoComplete="name"
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
            errors.name ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
          }`} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Phone number <span className="text-[#C8290A]">*</span>
        </label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0712 345 678" autoComplete="tel"
          className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all ${
            errors.phone ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
          }`} />
        <p className="text-xs text-gray-400 mt-1">Used for delivery coordination and M-Pesa payment.</p>
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Delivery notes <span className="text-xs font-normal text-gray-400">optional</span>
        </label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Blue gate, call when nearby, apartment 3B…"
          rows={3}
          className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all resize-none" />
      </div>
    </div>
  );
}

function Step1Location({ location, setLocation, manualAddress, setManualAddress, errors }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-600">
        Search your area or tap the map to pin your delivery location.{" "}
        <span className="text-green-700 font-medium">🟢 = our Kasarani shop.</span>
      </p>

      <DeliveryMap onLocationSelect={setLocation} selectedLocation={location} />

      {location && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-lg shrink-0">📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Delivery location set!</p>
            <p className="text-xs text-green-700 mt-0.5 break-word">{location.address}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-xs font-medium text-green-800">{location.zone.label}</span>
              <span className="text-xs font-bold text-[#C8290A] bg-red-50 px-2 py-0.5 rounded-full">
                Fee: KSh {location.zone.fee}
              </span>
            </div>
          </div>
          <button onClick={() => setLocation(null)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Or type your address manually
        </label>
        <input type="text" value={manualAddress} onChange={(e) => setManualAddress(e.target.value)}
          placeholder="e.g. Umoja Estate, Stage 5, Nairobi"
          className="w-full px-4 py-3 text-sm border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all" />
        {!location && manualAddress.trim() && (
          <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
            ⚠️ Delivery fee will be confirmed when we call to confirm your order.
          </p>
        )}
      </div>

      {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}

      {/* Zone table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery fees from Kasarani</p>
        </div>
        {DELIVERY_ZONES.slice(0, 7).map((z) => (
          <div key={z.label} className={`flex justify-between px-4 py-2.5 text-xs border-b border-gray-50 last:border-0 ${
            location?.zone?.label === z.label ? "bg-red-50 font-semibold" : "hover:bg-gray-50"
          }`}>
            <span className="text-gray-700">{z.label}</span>
            <span className="font-bold text-[#C8290A] ml-3 shrink-0">KSh {z.fee}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2Payment({ paymentMethod, setPaymentMethod, phone }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600 mb-1">Choose how you'd like to pay for your order.</p>
      <PaymentOption id="mpesa" selected={paymentMethod === "mpesa"} onSelect={setPaymentMethod} icon="📱" title="M-Pesa" description="You'll receive an STK push after placing the order. Fast & secure." badge="Most popular" />
      <PaymentOption id="card"  selected={paymentMethod === "card"}  onSelect={setPaymentMethod} icon="💳" title="Card / Bank transfer" description="Pay via Pesapal — Visa, Mastercard, or bank transfer accepted." />
      <PaymentOption id="cash"  selected={paymentMethod === "cash"}  onSelect={setPaymentMethod} icon="💵" title="Cash on delivery" description="Pay cash when your order arrives. No advance payment needed." />
      {paymentMethod === "mpesa" && phone && (
        <div className="mt-1 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
          <p className="font-semibold mb-1">💡 How M-Pesa works:</p>
          <p>After placing your order, you'll get an STK push to <strong>{phone}</strong>. Enter your PIN to confirm — we start preparing once payment is received.</p>
        </div>
      )}
    </div>
  );
}

const CAT_EMOJI = { broiler_live:"🐓", kienyeji_live:"🐔", slaughtered:"🥩", fried_pieces:"🍗", fried_whole:"🍖" };

function Step3Review({ items, name, phone, notes, location, manualAddress, paymentMethod, subtotal, deliveryFee, grandTotal, submitError }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 border-b border-gray-100">Your items ({items.length})</p>
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{CAT_EMOJI[item.category] ?? "🐔"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 shrink-0">KSh {(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <ReviewRow label="Customer"   value={name} />
        <ReviewRow label="Phone"      value={phone} />
        <ReviewRow label="Deliver to" value={location?.address ?? manualAddress} />
        <ReviewRow label="Zone"       value={location?.zone?.label ?? "To be confirmed"} />
        <ReviewRow label="Payment"    value={paymentMethod === "mpesa" ? "M-Pesa STK Push" : paymentMethod === "card" ? "Card / Bank transfer" : "Cash on delivery"} />
        {notes && <ReviewRow label="Notes" value={notes} />}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <ReviewRow label="Subtotal"     value={`KSh ${subtotal.toLocaleString()}`} />
        <ReviewRow label="Delivery fee" value={`KSh ${deliveryFee.toLocaleString()}`} />
        <ReviewRow label="Total"        value={`KSh ${grandTotal.toLocaleString()}`} bold red />
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN CHECKOUT
───────────────────────────────────── */
export default function Checkout() {
  const navigate  = useNavigate();
  const items     = useCartStore((s) => s.items);
  const subtotal  = useCartStore(selectCartTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const user      = useAuthStore((s) => s.user);
  const profile   = useAuthStore((s) => s.profile);
  const authLoading = useAuthStore((s) => s.loading);

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // Pre-filled from profile if logged in
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [location,      setLocation]      = useState(null);
  const [manualAddress, setManualAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("mpesa");

  useEffect(() => {
    // Wait for auth to initialise before deciding
    if (authLoading) return;

    // If not logged in, redirect to login with ?next=/checkout&reason=checkout
    if (!user) {
      navigate("/login?next=%2Fcheckout&reason=checkout", { replace: true });
      return;
    }

    if (items.length === 0) { navigate("/cart"); return; }

    // Pre-fill details from profile
    if (profile?.full_name && !name) setName(profile.full_name);
    if (profile?.phone && !phone) {
      // Normalise to 0XXXXXXXXX display format
      let p = profile.phone;
      if (p.startsWith("+254")) p = "0" + p.slice(4);
      else if (p.startsWith("254")) p = "0" + p.slice(3);
      setPhone(p);
    }
    if (profile?.default_area && !manualAddress) setManualAddress(profile.default_area);

    window.scrollTo(0, 0);
  }, [authLoading, user, profile, items.length]); // eslint-disable-line

  const deliveryFee = location?.zone?.fee ?? 200;
  const grandTotal  = subtotal + deliveryFee;

  function validateStep(s) {
    const e = {};
    if (s === 0) {
      if (!name.trim())  e.name  = "Please enter your full name.";
      if (!phone.trim()) e.phone = "Please enter your phone number.";
      else if (!/^(?:0|\+?254)[17]\d{8}$/.test(phone.replace(/[\s-]/g, "")))
        e.phone = "Enter a valid Kenyan number, e.g. 0712 345 678.";
    }
    if (s === 1) {
      if (!location && !manualAddress.trim())
        e.location = "Please pin your location on the map or type your address.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) { setErrors({}); setStep((s) => s + 1); window.scrollTo(0, 0); }
  }
  function prevStep() {
    setErrors({}); setStep((s) => Math.max(0, s - 1)); window.scrollTo(0, 0);
  }

  async function placeOrder() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").insert([{
        user_id:       user?.id ?? null,
        customer_name: name.trim(),
        phone:         phone.trim().replace(/[\s-]/g, ""),
        location:      location?.address ?? manualAddress.trim(),
        lat:           location?.lat ?? null,
        lng:           location?.lng ?? null,
        delivery_zone: location?.zone?.label ?? "To be confirmed",
        items, subtotal,
        delivery_fee:  deliveryFee,
        total:         grandTotal,
        payment_type:  paymentMethod,
        paid:          false,
        status:        "pending",
        notes:         notes.trim() || null,
      }]).select("id").single();

      if (error) throw error;
      clearCart();
      navigate(`/order-success?id=${data.id}&payment=${paymentMethod}`);
    } catch (err) {
      setErrors((e) => ({ ...e, submit: err.message ?? "Failed to place order. Please try again." }));
    } finally {
      setLoading(false);
    }
  }

  const stepTitles    = ["Your details", "Delivery location", "Payment method", "Review your order"];
  const stepSubtitles = [
    "We need your name and phone for delivery coordination.",
    "Show us where to deliver. Our shop is in Kasarani.",
    "Choose how you want to pay.",
    "Everything look good? Tap place order!",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#C8290A]">Home</Link>
            <span>/</span>
            <Link to="/cart" className="hover:text-[#C8290A]">Cart</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Checkout</span>
          </nav>
          <StepIndicator current={step} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{stepTitles[step]}</h1>
          <p className="text-sm text-gray-500 mt-1">{stepSubtitles[step]}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-5">
          {step === 0 && <Step0Details name={name} setName={setName} phone={phone} setPhone={setPhone} notes={notes} setNotes={setNotes} errors={errors} />}
          {step === 1 && <Step1Location location={location} setLocation={setLocation} manualAddress={manualAddress} setManualAddress={setManualAddress} errors={errors} />}
          {step === 2 && <Step2Payment paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} phone={phone} />}
          {step === 3 && <Step3Review items={items} name={name} phone={phone} notes={notes} location={location} manualAddress={manualAddress} paymentMethod={paymentMethod} subtotal={subtotal} deliveryFee={deliveryFee} grandTotal={grandTotal} submitError={errors.submit} />}
        </div>

        <div className="flex items-center gap-3">
          {step > 0 && (
            <button onClick={prevStep} className="flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white font-bold text-sm py-3 rounded-xl transition-colors">
              Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          ) : (
            <button onClick={placeOrder} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl transition-colors">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing order…</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Place order — KSh {grandTotal.toLocaleString()}</>
              }
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          Secure checkout — your information is never shared
        </p>
      </div>
    </div>
  );
}