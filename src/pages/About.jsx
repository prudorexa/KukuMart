// src/pages/About.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#C8290A] mb-3">
      {children}
    </p>
  );
}

const VALUES = [
  { emoji: "🕌", title: "Halal certified", desc: "Every single chicken we sell is slaughtered the halal way by trained butchers. No shortcuts, ever." },
  { emoji: "🌿", title: "Farm fresh daily", desc: "We source directly from trusted farms every single morning. What you receive was alive or freshly slaughtered that same day." },
  { emoji: "❤️", title: "Family business", desc: "KukuMart is a family business. When you order from us, you're supporting a real Nairobi family — not a corporation." },
  { emoji: "🛵", title: "Fast delivery", desc: "We deliver across all of Nairobi. Order before 2 PM and we get your chicken to you same day." },
  { emoji: "🐔", title: "All types, one place", desc: "Live broilers, live kienyeji, freshly slaughtered, fried pieces — we have every type of chicken you need." },
  { emoji: "📦", title: "Bulk welcome", desc: "Hotels, restaurants, weddings — we handle bulk orders of any size. Just give us a call or WhatsApp." },
];

const TEAM = [
  { initial: "B", name: "Baba Nyambu", role: "Master chicken farmer & supplier", desc: "Over 15 years of experience sourcing the freshest chicken in Nairobi. Every bird that leaves our hands has been personally inspected." },
  { initial: "M", name: "Mama Nyambu", role: "Quality & customer happiness", desc: "Ensures every order goes out perfectly and every customer is satisfied. The backbone of KukuMart's reputation." },
];

export default function About() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="w-full bg-white">

      {/* Hero */}
      <section className="w-full bg-[#C8290A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <SectionLabel>Our story</SectionLabel>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
            A family that loves<br />fresh chicken.
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto leading-relaxed">
            KukuMart started as a single family's passion for supplying the freshest, most honest
            chicken in Nairobi. Today we deliver to hundreds of families every week — and we treat every
            order like it's going to our own table.
          </p>
        </div>
        {/* Wave */}
        <div className="w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 40" fill="white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 sm:h-10">
            <path d="M0,24 C360,0 1080,48 1440,24 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </section>

      {/* Story section */}
      <section className="w-full py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Illustration */}
            <div className="shrink-0 w-full lg:w-80">
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 flex flex-col items-center gap-4">
                <div className="text-7xl">🐓</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">15+ years</p>
                  <p className="text-sm text-gray-500">serving Nairobi families</p>
                </div>
                <div className="w-full border-t border-gray-200 pt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-[#C8290A]">500+</p>
                    <p className="text-xs text-gray-500">happy customers</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#C8290A]">Daily</p>
                    <p className="text-xs text-gray-500">fresh sourcing</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#C8290A]">100%</p>
                    <p className="text-xs text-gray-500">halal certified</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#C8290A]">Nairobi</p>
                    <p className="text-xs text-gray-500">wide delivery</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Story text */}
            <div className="flex-1">
              <SectionLabel>How it started</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
                From Kasarani to every corner of Nairobi.
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base">
                <p>
                  KukuMart was born out of a simple frustration — finding truly fresh, halal chicken in Nairobi
                  was harder than it should be. Our founder, who has been supplying chicken to families and
                  restaurants in Kasarani for over 15 years, decided to take what he knew best and bring it online.
                </p>
                <p>
                  What started as a small operation supplying neighbours and local restaurants grew into
                  KukuMart — a proper delivery service that brings farm-fresh chicken to every part of the city.
                  We still run it the same way: personally, honestly, and with pride.
                </p>
                <p>
                  Every chicken that leaves our hands has been sourced that morning. Every order is packed
                  with care. Every customer gets a follow-up call to make sure everything was perfect.
                  That's the KukuMart promise — and it's been our promise since day one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="w-full py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>What we stand for</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Our values
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-gray-200 p-6">
                <span className="text-3xl block mb-3">{v.emoji}</span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="w-full py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionLabel>The team</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              The family behind KukuMart
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
            {TEAM.map((person) => (
              <div key={person.name} className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#C8290A] flex items-center justify-center text-white text-2xl font-bold">
                  {person.initial}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{person.name}</h3>
                  <p className="text-xs font-semibold text-[#C8290A] mt-0.5">{person.role}</p>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{person.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-[#C8290A] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to taste the difference?</h2>
          <p className="text-white/75 mb-8 max-w-md mx-auto">Fresh chicken, delivered by a family that cares. Order today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/shop" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#C8290A] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-red-50 transition-colors">
              Shop now
            </Link>
            <Link to="/contact" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}