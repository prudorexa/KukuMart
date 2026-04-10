import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { useCartStore, selectCartCount } from "../store/cartStore";

const useCartCount = () => useCartStore(selectCartCount);

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const cartCount = useCartCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when navigating
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header
      className={`w-full sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "border-b border-gray-100"
      }`}
    >
      {/* Thin red accent line at very top */}
      <div className="h-3px w-full bg-[#C8290A]" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 bg-[#C8290A] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#a82008] transition-colors duration-150">
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <ellipse cx="20" cy="27" rx="10" ry="11" fill="white" />
                <ellipse cx="20" cy="14" rx="7" ry="6.5" fill="white" />
                <ellipse cx="16.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130" />
                <ellipse cx="20" cy="7" rx="2" ry="3.3" fill="#FCA130" />
                <ellipse cx="23.5" cy="8.5" rx="2" ry="2.8" fill="#FCA130" />
                <polygon points="26,13 32,15.5 26,17.5" fill="#FCA130" />
                <circle cx="24" cy="12.5" r="1.7" fill="#C8290A" />
                <path d="M10,24 Q3,15 6,9 Q11,21 12,25Z" fill="rgba(255,255,255,0.4)" />
              </svg>
            </div>
            <div className="leading-none">
              <div className="text-[20px] font-bold text-gray-900 tracking-tight leading-none">
                Kuku<span className="text-[#C8290A]">Mart</span>
              </div>
              <div className="text-[9px] text-gray-400 tracking-[0.14em] uppercase mt-0.5 font-medium">
                Fresh Chicken · Nairobi
              </div>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-red-50 text-[#C8290A]"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right: cart + CTA + hamburger ── */}
          <div className="flex items-center gap-2">

            {/* Cart icon button */}
            <Link
              to="/cart"
              aria-label="View cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-18px h-18px bg-[#C8290A] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Order now — desktop only */}
            <Link
              to="/shop"
              className="hidden md:inline-flex items-center gap-2 bg-[#C8290A] hover:bg-[#a82008] active:bg-[#8a1a06] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
              </svg>
              Order now
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-red-50 text-[#C8290A]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-1 border-t border-gray-100" />

            {/* Mobile order button */}
            <Link
              to="/shop"
              className="flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors duration-150"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
              </svg>
              Order now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}