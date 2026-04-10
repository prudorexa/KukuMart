import { Link } from "react-router-dom";

// ── Update this with your dad's real Safaricom number ──
const WA_NUMBER = "254700000000";
const WA_MESSAGE = encodeURIComponent(
  "Hello KukuMart! 👋 I'd like to place an order.\n\nMy name is: ___\nI'm in (area): ___\nI'd like to order: ___"
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const SHOP_LINKS = [
  { label: "Live broiler chicken", to: "/shop?cat=broiler_live" },
  { label: "Live kienyeji chicken", to: "/shop?cat=kienyeji_live" },
  { label: "Slaughtered whole", to: "/shop?cat=slaughtered" },
  { label: "Fried pieces", to: "/shop?cat=fried_pieces" },
  { label: "Whole fried chicken", to: "/shop?cat=fried_whole" },
  { label: "Bulk & event orders", to: "/contact" },
];

const COMPANY_LINKS = [
  { label: "About us", to: "/about" },
  { label: "Contact us", to: "/contact" },
  { label: "Track my order", to: "/orders" },
  { label: "Delivery zones", to: "/" },
];

const DELIVERY_ZONES = [
  { area: "CBD & Town", fee: "KSh 150" },
  { area: "Westlands, Parklands", fee: "KSh 200" },
  { area: "South B, South C, Lang'ata", fee: "KSh 200" },
  { area: "Eastlands (Umoja, Donholm…)", fee: "KSh 200" },
  { area: "Kitengela, Rongai, Ngong", fee: "KSh 300" },
];

// ── Small reusable components ──────────────────────────

function FooterHeading({ children }) {
  return (
    <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
      {children}
    </h3>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-gray-500 hover:text-[#C8290A] transition-colors duration-150"
      >
        {children}
      </Link>
    </li>
  );
}

// ── Main Footer ─────────────────────────────────────────

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 mt-auto">

      {/* WhatsApp CTA strip */}
      <div className="w-full bg-[#C8290A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-base leading-tight">
              Prefer to order via WhatsApp?
            </p>
            <p className="text-red-200 text-sm mt-0.5">
              Chat with us directly — fastest way to get fresh chicken in Nairobi.
            </p>
          </div>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-[#C8290A] hover:bg-red-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors duration-150 whitespace-nowrap"
          >
            {/* WhatsApp icon */}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.514 5.833L.057 23.077a.75.75 0 00.919.906l5.411-1.421A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.899 0-3.68-.523-5.2-1.432l-.372-.223-3.862 1.013 1.036-3.77-.243-.388A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 bg-[#C8290A] rounded-lg flex items-center justify-center group-hover:bg-[#a82008] transition-colors duration-150">
                <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                  <ellipse cx="20" cy="27" rx="10" ry="11" fill="white" />
                  <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white" />
                  <ellipse cx="16.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130" />
                  <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130" />
                  <ellipse cx="23.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130" />
                  <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130" />
                  <circle cx="24" cy="12.5" r="1.7" fill="#C8290A" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Kuku<span className="text-[#C8290A]">Mart</span>
              </span>
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Nairobi's freshest chicken — broilers, kienyeji, slaughtered &amp; fried.
              Farm-fresh quality, delivered to your door.
            </p>

            {/* Contact details */}
            <ul className="space-y-2.5">
              <li>
                <a href={`tel:+${WA_NUMBER}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#C8290A] transition-colors duration-150">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#C8290A] shrink-0">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
                  </svg>
                  +254 720 461 267
                </a>
              </li>
              <li>
                <a href="mailto:orders@kukumart.co.ke" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#C8290A] transition-colors duration-150">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#C8290A] shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  orders@kukumart.co.ke
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-sm text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#C8290A] shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Mon – Sun: 6 AM – 8 PM
              </li>
            </ul>
          </div>

          {/* Shop links */}
          <div>
            <FooterHeading>Shop</FooterHeading>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((l) => <FooterLink key={l.label} to={l.to}>{l.label}</FooterLink>)}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <FooterHeading>Company</FooterHeading>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => <FooterLink key={l.label} to={l.to}>{l.label}</FooterLink>)}
            </ul>
          </div>

          {/* Delivery zones */}
          <div>
            <FooterHeading>Delivery zones</FooterHeading>
            <div className="space-y-2">
              {DELIVERY_ZONES.map(({ area, fee }) => (
                <div key={area} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2 last:border-0">
                  <span className="text-gray-500">{area}</span>
                  <span className="text-[#C8290A] font-semibold shrink-0 ml-3">{fee}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">
                Outside Nairobi? Call us for a quote.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges row */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { emoji: "🕌", label: "Halal certified" },
              { emoji: "🌿", label: "Farm fresh daily" },
              { emoji: "❄️", label: "Cold-chain delivery" },
              { emoji: "⭐", label: "500+ happy customers" },
            ].map(({ emoji, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 font-medium"
              >
                <span className="text-sm">{emoji}</span>
                {label}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              © {year} KukuMart. All rights reserved. Nairobi, Kenya.
            </p>
            <Link
              to="/admin"
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors duration-150"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}