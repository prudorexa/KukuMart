import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────
   WHATSAPP CONFIG  (keep in sync with Footer)
───────────────────────────────────────── */
const WA_NUMBER = "254720461267";
const WA_MESSAGE = encodeURIComponent(
  "Hello KukuMart! 👋 I'd like to place an order.\n\nMy name is: ___\nI'm in (area): ___\nI'd like to order: ___"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const CATEGORIES = [
  {
    id: "broiler_live",
    title: "Live Broiler",
    subtitle: "Ready for purchase — healthy & well-fed",
    emoji: "🐓",
    tag: "Live",
    tagColor: "bg-green-100 text-green-800",
    price: "From KSh 800",
  },
  {
    id: "kienyeji_live",
    title: "Live Kienyeji",
    subtitle: "Free-range, naturally raised local chicken",
    emoji: "🐔",
    tag: "Live",
    tagColor: "bg-green-100 text-green-800",
    price: "From KSh 1,500",
  },
  {
    id: "slaughtered",
    title: "Slaughtered",
    subtitle: "Halal-slaughtered, cleaned & ready to cook",
    emoji: "🥩",
    tag: "Ready to cook",
    tagColor: "bg-orange-100 text-orange-800",
    price: "From KSh 500",
  },
  {
    id: "fried_pieces",
    title: "Fried Pieces",
    subtitle: "Crispy fried pieces — ready to eat now",
    emoji: "🍗",
    tag: "Ready to eat",
    tagColor: "bg-red-100 text-red-800",
    price: "From KSh 40/pc",
  },
  {
    id: "fried_whole",
    title: "Whole Fried",
    subtitle: "Whole chicken, perfectly fried & seasoned",
    emoji: "🍖",
    tag: "Ready to eat",
    tagColor: "bg-red-100 text-red-800",
    price: "KSh 750",
  },
  {
    id: "bulk",
    title: "Bulk Orders",
    subtitle: "Weddings, events, hotels & restaurants",
    emoji: "📦",
    tag: "Custom pricing",
    tagColor: "bg-blue-100 text-blue-800",
    price: "Call us",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Browse & choose",
    desc: "Pick your chicken — live, slaughtered, or fried. Any type, any quantity.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Place your order",
    desc: "Order online or tap the WhatsApp button — we confirm within minutes.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Pay your way",
    desc: "M-Pesa, card, or cash on delivery — whatever works for you.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Fresh delivery",
    desc: "We deliver anywhere in Nairobi — same day if ordered before 2 PM.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

const REVIEWS = [
  {
    name: "Amina W.",
    area: "Westlands",
    stars: 5,
    text: "Best kienyeji chicken in Nairobi, hands down. Delivery was on time and the chicken was so fresh. Will definitely order again!",
    initial: "A",
  },
  {
    name: "Brian O.",
    area: "South B",
    stars: 5,
    text: "Ordered 20 chickens for my wedding — KukuMart delivered every single one fresh and on time. The catering team was impressed.",
    initial: "B",
  },
  {
    name: "Fatuma K.",
    area: "Eastlands",
    stars: 5,
    text: "I love that they're halal certified. The fried pieces are amazing and the WhatsApp ordering is so easy. My family orders every Friday.",
    initial: "F",
  },
];

const DELIVERY_ZONES = [
  { area: "CBD & Town", fee: "KSh 70", time: "1–2 hrs" },
  { area: "Westlands, Parklands", fee: "KSh 200", time: "1–2 hrs" },
  { area: "South B / C, Lang'ata", fee: "KSh 200", time: "1–2 hrs" },
  { area: "Eastlands (Umoja, Donholm…)", fee: "KSh 200", time: "2–3 hrs" },
  { area: "Kitengela, Rongai, Ngong", fee: "KSh 300", time: "2–4 hrs" },
];

/* ─────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C8290A] mb-3">
      {children}
    </p>
  );
}

function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   USEANIMATION HOOK — fade-in on scroll
───────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─────────────────────────────────────────
   SECTION COMPONENTS
───────────────────────────────────────── */

/* ── 1. HERO ── */
function Hero() {
  return (
    <section className="w-full bg-[#C8290A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 py-16 lg:py-24">

          {/* Left — copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90 text-xs font-medium tracking-wide">
                Delivering across Nairobi daily
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-5">
              Fresh chicken,<br />
              <span className="text-white/70">delivered to</span><br />
              your door.
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Live broilers, kienyeji, slaughtered &amp; fried — straight from
              the farm to your kitchen anywhere in Nairobi.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#C8290A] font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-red-50 transition-colors duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
                </svg>
                Shop now
              </Link>

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-white/40 text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Order on WhatsApp
              </a>
            </div>

            {/* Social proof mini-bar */}
            <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["A", "B", "F", "J"].map((l, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-white/20 border-2 border-[#C8290A] flex items-center justify-center text-white text-xs font-bold"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FCD34D">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/60 text-xs">500+ happy customers in Nairobi</p>
              </div>
            </div>
          </div>

          {/* Right — illustrated chicken visual */}
          <div className="shrink-0 flex items-center justify-center w-full lg:w-auto">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-spin" style={{ animationDuration: "30s" }} />
              {/* Inner ring */}
              <div className="absolute inset-8 rounded-full border border-white/10" />
              {/* Center circle */}
              <div className="absolute inset-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <svg width="110" height="110" viewBox="0 0 100 100" fill="none">
                  {/* Body */}
                  <ellipse cx="50" cy="65" rx="24" ry="26" fill="white" opacity="0.95" />
                  {/* Wing */}
                  <ellipse cx="46" cy="68" rx="15" ry="18" fill="white" opacity="0.5" />
                  {/* Neck */}
                  <rect x="42" y="38" width="16" height="22" rx="6" fill="white" opacity="0.95" />
                  {/* Head */}
                  <ellipse cx="50" cy="34" rx="15" ry="13" fill="white" opacity="0.95" />
                  {/* Comb */}
                  <ellipse cx="43" cy="22" rx="4.5" ry="6.5" fill="#FCA130" />
                  <ellipse cx="50" cy="19" rx="4.5" ry="8" fill="#FCA130" />
                  <ellipse cx="57" cy="22" rx="4.5" ry="6.5" fill="#FCA130" />
                  {/* Beak */}
                  <polygon points="63,31 74,34.5 63,38" fill="#FCA130" />
                  {/* Eye */}
                  <circle cx="61" cy="30" r="4" fill="#C8290A" />
                  <circle cx="62" cy="29" r="1.5" fill="white" />
                  {/* Wattle */}
                  <ellipse cx="64" cy="39" rx="4" ry="6" fill="#FCA130" />
                  {/* Tail feathers */}
                  <path d="M26,58 Q10,38 14,24 Q22,46 28,58Z" fill="white" opacity="0.5" />
                  <path d="M28,63 Q8,50 12,36 Q22,52 30,64Z" fill="white" opacity="0.35" />
                  <path d="M24,68 Q6,62 8,48 Q20,58 26,70Z" fill="white" opacity="0.25" />
                  {/* Legs */}
                  <line x1="43" y1="89" x2="37" y2="100" stroke="#FCA130" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="55" y1="89" x2="62" y2="100" stroke="#FCA130" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="37" y1="100" x2="28" y2="103" stroke="#FCA130" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="37" y1="100" x2="37" y2="106" stroke="#FCA130" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="37" y1="100" x2="45" y2="104" stroke="#FCA130" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="62" y1="100" x2="55" y2="104" stroke="#FCA130" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="62" y1="100" x2="62" y2="106" stroke="#FCA130" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="62" y1="100" x2="70" y2="103" stroke="#FCA130" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Floating badges */}
              <div className="absolute top-4 right-0 bg-white rounded-xl px-3 py-2 shadow-lg">
                <p className="text-[10px] text-gray-400 font-medium">Same-day delivery</p>
                <p className="text-xs font-bold text-gray-900">Order by 4 PM ⚡</p>
              </div>
              <div className="absolute bottom-6 left-0 bg-white rounded-xl px-3 py-2 shadow-lg">
                <p className="text-[10px] text-gray-400 font-medium">Certified</p>
                <p className="text-xs font-bold text-gray-900">🕌 Halal slaughter</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1440 48" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-12">
          <path d="M0,32 C240,0 480,48 720,32 C960,16 1200,48 1440,32 L1440,48 L0,48 Z" />
        </svg>
      </div>
    </section>
  );
}

/* ── 2. TRUST BAR ── */
function TrustBar() {
  const items = [
    { icon: "🕌", label: "Halal certified" },
    { icon: "🌿", label: "Farm-fresh daily" },
    { icon: "⚡", label: "Same-day delivery" },
    { icon: "🛵", label: "Nairobi-wide" },
    { icon: "⭐", label: "500+ customers" },
    { icon: "❄️", label: "Cold-chain kept" },
  ];

  return (
    <section className="w-full border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between overflow-x-auto gap-6 scrollbar-hide">
          {items.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 3. CATEGORIES ── */
function Categories() {
  const [ref, visible] = useFadeIn();

  return (
    <section
      ref={ref}
      className={`w-full py-16 sm:py-20 bg-white transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <SectionLabel>What we sell</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Every type of chicken,<br className="hidden sm:block" /> one place.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/shop?cat=${cat.id}`}
              className="group relative bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-[#C8290A]/30 rounded-2xl p-6 transition-all duration-200 flex flex-col gap-3"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {/* Emoji + tag row */}
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                  {cat.emoji}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cat.tagColor}`}>
                  {cat.tag}
                </span>
              </div>

              {/* Text */}
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#C8290A] transition-colors duration-150">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{cat.subtitle}</p>
              </div>

              {/* Price + arrow */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-sm font-semibold text-[#C8290A]">{cat.price}</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="text-gray-300 group-hover:text-[#C8290A] group-hover:translate-x-1 transition-all duration-200"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA below grid */}
        <div className="text-center mt-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-colors duration-150"
          >
            View full shop
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 4. HOW IT WORKS ── */
function HowItWorks() {
  const [ref, visible] = useFadeIn();

  return (
    <section
      ref={ref}
      className={`w-full py-16 sm:py-20 bg-gray-50 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Order in 4 simple steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center gap-4">
              {/* Connector line — desktop only */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+36px)] w-[calc(100%-72px)] h-px border-t-2 border-dashed border-gray-200" />
              )}

              {/* Icon circle */}
              <div className="relative w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-sm z-10">
                {step.icon}
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C8290A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {step.num.replace("0", "")}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. FEATURED / WHY US ── */
function WhyUs() {
  const [ref, visible] = useFadeIn();

  const perks = [
    {
      title: "Halal certified",
      desc: "All our chickens are slaughtered the halal way — every single time, without exception.",
      emoji: "🕌",
    },
    {
      title: "Farm fresh every day",
      desc: "We source directly from trusted farms around Nairobi so you always get the freshest chicken.",
      emoji: "🌿",
    },
    {
      title: "Broilers & kienyeji",
      desc: "We carry both broiler and free-range kienyeji — live or slaughtered, your choice.",
      emoji: "🐔",
    },
    {
      title: "Ready-to-eat fried chicken",
      desc: "Our fried chicken is seasoned, crispy and ready to eat — perfect for events and quick meals.",
      emoji: "🍗",
    },
    {
      title: "Bulk & event orders",
      desc: "Hotels, restaurants, weddings — we handle bulk orders of any size with ease.",
      emoji: "📦",
    },
    {
      title: "Fast Nairobi delivery",
      desc: "Order before 2 PM for same-day delivery. We reach every corner of Nairobi.",
      emoji: "🛵",
    },
  ];

  return (
    <section
      ref={ref}
      className={`w-full py-16 sm:py-20 bg-white transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Left text */}
          <div className="lg:w-80 shrink-0">
            <SectionLabel>Why KukuMart</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Nairobi's most trusted chicken supplier.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              We've been supplying fresh chicken to Nairobi families, restaurants
              and events for years. Quality and freshness is everything to us.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline"
            >
              Read our story
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Right perks grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perks.map((perk) => (
              <div key={perk.title} className="bg-gray-50 rounded-2xl p-5">
                <span className="text-2xl mb-3 block">{perk.emoji}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{perk.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 6. REVIEWS ── */
function Reviews() {
  const [ref, visible] = useFadeIn();

  return (
    <section
      ref={ref}
      className={`w-full py-16 sm:py-20 bg-gray-50 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <SectionLabel>Customer reviews</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Nairobi loves KukuMart
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
              <StarRating count={r.stars} />
              <p className="text-sm text-gray-700 leading-relaxed flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="w-9 h-9 rounded-full bg-[#C8290A] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {r.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.area}, Nairobi</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 7. DELIVERY ZONES ── */
function DeliveryZones() {
  const [ref, visible] = useFadeIn();

  return (
    <section
      ref={ref}
      id="delivery"
      className={`w-full py-16 sm:py-20 bg-white transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 items-center">

          {/* Left — table */}
          <div className="flex-1 w-full">
            <SectionLabel>Delivery</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
              We deliver across Nairobi
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Order before 2 PM for same-day delivery. Outside these zones? Call us.
            </p>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-5 py-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Delivery fee</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Est. time</span>
              </div>

              {DELIVERY_ZONES.map(({ area, fee, time }, i) => (
                <div
                  key={area}
                  className={`grid grid-cols-3 px-5 py-4 items-center ${
                    i < DELIVERY_ZONES.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <span className="text-sm text-gray-800 font-medium">{area}</span>
                  <span className="text-sm font-bold text-[#C8290A] text-center">{fee}</span>
                  <span className="text-sm text-gray-500 text-right">{time}</span>
                </div>
              ))}

              {/* Outside zones row */}
              <div className="bg-gray-50 border-t border-gray-200 px-5 py-3.5">
                <p className="text-xs text-gray-500 text-center">
                  Outside Nairobi? <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="text-[#C8290A] font-semibold hover:underline">WhatsApp us</a> for a custom quote.
                </p>
              </div>
            </div>
          </div>

          {/* Right — simple illustrated map placeholder */}
          <div className="shrink-0 w-full lg:w-80">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">🗺️</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">We're all over Nairobi</h3>
              <p className="text-sm text-gray-500 mb-5">
                From CBD to Westlands, South B to Eastlands — we deliver fresh chicken to every corner of the city.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline"
              >
                Not sure about your area? Contact us
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 8. FAQ ── */
function FAQ() {
  const [open, setOpen] = useState(null);
  const [ref, visible] = useFadeIn();

  const faqs = [
    {
      q: "Are your chickens halal?",
      a: "Yes — every single chicken we sell is slaughtered the halal way by trained butchers. We do not compromise on this.",
    },
    {
      q: "How fresh is the chicken?",
      a: "We source directly from farms every morning. What you receive was alive or freshly slaughtered that same day.",
    },
    {
      q: "Can I order live chickens?",
      a: "Absolutely! We sell both live broilers and live kienyeji chickens. You can also request slaughtering before delivery.",
    },
    {
      q: "What is the minimum order?",
      a: "There is no minimum order — you can order a single piece of fried chicken or a single live chicken. For bulk orders, contact us.",
    },
    {
      q: "How do I pay?",
      a: "We accept M-Pesa (STK Push to your phone), card payments, and cash on delivery. You choose at checkout.",
    },
    {
      q: "Do you cater for events and weddings?",
      a: "Yes! We handle bulk orders for weddings, corporate events, hotels and restaurants. WhatsApp or call us for custom pricing.",
    },
  ];

  return (
    <section
      ref={ref}
      className={`w-full py-16 sm:py-20 bg-gray-50 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                open === i ? "border-[#C8290A]/30" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
              >
                <span className={`text-sm font-semibold ${open === i ? "text-[#C8290A]" : "text-gray-900"}`}>
                  {faq.q}
                </span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={open === i ? "#C8290A" : "#9CA3AF"} strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 9. CTA BANNER ── */
function CTABanner() {
  const [ref, visible] = useFadeIn();

  return (
    <section
      ref={ref}
      className={`w-full bg-[#C8290A] transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
        <p className="text-white/70 text-sm font-medium mb-2 tracking-wide uppercase">Ready to order?</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
          Get fresh chicken delivered today.
        </h2>
        <p className="text-white/70 text-base mb-8 max-w-md mx-auto">
          Order online or chat on WhatsApp — we confirm fast and deliver same-day.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#C8290A] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-red-50 transition-colors duration-150"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
            </svg>
            Shop now
          </Link>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Order on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────── */
export default function Home() {
  // Scroll to top on mount
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <div className="w-full">
      <Hero />
      <TrustBar />
      <Categories />
      <HowItWorks />
      <WhyUs />
      <Reviews />
      <DeliveryZones />
      <FAQ />
      <CTABanner />
    </div>
  );
}