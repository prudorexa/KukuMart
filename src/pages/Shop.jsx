// src/pages/Shop.jsx
// Full shop page — fetches products from Supabase, filter by category,
// search by name, sort, and add to cart via Zustand.

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import { useCartStore, selectCartCount, selectCartTotal } from "../store/cartStore";

/* ─────────────────────────────────────
   CONSTANTS
───────────────────────────────────── */
const CATEGORIES = [
  { id: "all",           label: "All chicken",      emoji: "🐔" },
  { id: "broiler_live",  label: "Live broiler",      emoji: "🐓" },
  { id: "kienyeji_live", label: "Live kienyeji",     emoji: "🐔" },
  { id: "slaughtered",   label: "Slaughtered",       emoji: "🥩" },
  { id: "fried_pieces",  label: "Fried pieces",      emoji: "🍗" },
  { id: "fried_whole",   label: "Whole fried",       emoji: "🍖" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "price_asc",       label: "Price: low to high" },
  { value: "price_desc",      label: "Price: high to low" },
  { value: "name_asc",        label: "Name: A–Z" },
];

/* ─────────────────────────────────────
   SKELETON CARD (loading state)
───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-4/3 bg-gray-100" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-10 bg-gray-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   EMPTY STATE
───────────────────────────────────── */
function EmptyState({ search, category, onClear }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
      <span className="text-5xl">🔍</span>
      <h3 className="text-lg font-bold text-gray-900">No products found</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        {search
          ? `No chicken matches "${search}"${category !== "all" ? " in this category" : ""}.`
          : "No products in this category yet."}
      </p>
      <button
        onClick={onClear}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

/* ─────────────────────────────────────
   ERROR STATE
───────────────────────────────────── */
function ErrorState({ message, onRetry }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
      <span className="text-5xl">⚠️</span>
      <h3 className="text-lg font-bold text-gray-900">Couldn't load products</h3>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-2 bg-[#C8290A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#a82008] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

/* ─────────────────────────────────────
   STICKY CART BAR (appears when cart has items)
───────────────────────────────────── */
function CartBar() {
  const count = useCartStore(selectCartCount);
  const total = useCartStore(selectCartTotal);

  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C8290A] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {count}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {count} item{count !== 1 ? "s" : ""} in cart
            </p>
            <p className="text-xs text-gray-500">
              Total: <span className="font-bold text-[#C8290A]">KSh {total.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <Link
          to="/cart"
          className="shrink-0 inline-flex items-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150"
        >
          View cart
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN SHOP PAGE
───────────────────────────────────── */
export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ──
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("created_at_desc");
  const [showFilters, setShowFilters] = useState(false);

  // Active category comes from URL param so links from Homepage work
  const activeCategory = searchParams.get("cat") ?? "all";

  function setCategory(cat) {
    setSearchParams(cat === "all" ? {} : { cat });
  }

  // ── Fetch products from Supabase ──
  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("products")
        .select("id, name, description, price, category, image_url, in_stock, weight_kg, created_at");

      // Apply category filter on the server if not "all"
      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      // Apply server-side sort
      const [sortField, sortDir] = sort.split("_").reduce((acc, part, i, arr) => {
        if (i === arr.length - 1) return [acc[0], part];
        return [acc[0] ? `${acc[0]}_${part}` : part, acc[1]];
      }, ["", ""]);

      // Map sort value → Supabase column
      const sortMap = {
        created_at_desc: { col: "created_at", asc: false },
        price_asc:       { col: "price",      asc: true  },
        price_desc:      { col: "price",      asc: false },
        name_asc:        { col: "name",        asc: true  },
      };
      const { col, asc } = sortMap[sort] ?? sortMap.created_at_desc;
      query = query.order(col, { ascending: asc });

      const { data, error: sbError } = await query;
      if (sbError) throw sbError;
      setProducts(data ?? []);
    } catch (err) {
      console.error("Shop fetch error:", err);
      setError(err.message ?? "Something went wrong loading products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sort]);

  // ── Client-side search filter ──
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  // Separate in-stock from out-of-stock (show in-stock first)
  const sorted = useMemo(() => {
    return [
      ...filteredProducts.filter((p) => p.in_stock),
      ...filteredProducts.filter((p) => !p.in_stock),
    ];
  }, [filteredProducts]);

  // ── Active category label ──
  const activeCatLabel =
    CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "All chicken";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ── */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-[#C8290A] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Shop</span>
            {activeCategory !== "all" && (
              <>
                <span>/</span>
                <span className="text-gray-700 font-medium">{activeCatLabel}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {activeCategory === "all" ? "All chicken" : activeCatLabel}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {loading
                  ? "Loading products…"
                  : `${sorted.length} product${sorted.length !== 1 ? "s" : ""} available`}
              </p>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:block">
                Sort by
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar: category filters ── */}
          <aside className="lg:w-56 shrink-0">
            {/* Mobile: toggle button */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="lg:hidden w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 mb-3"
            >
              <span className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
                </svg>
                Filter by category
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Category list */}
            <div className={`lg:block ${showFilters ? "block" : "hidden"}`}>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </p>
                </div>
                <nav className="flex flex-col p-2 gap-0.5">
                  {CATEGORIES.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setShowFilters(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150 ${
                          active
                            ? "bg-red-50 text-[#C8290A]"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="text-base">{cat.emoji}</span>
                        {cat.label}
                        {active && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Halal badge */}
              <div className="mt-3 bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-800 mb-1">🕌 Halal certified</p>
                <p className="text-xs text-green-700 leading-relaxed">
                  All our chicken is slaughtered the halal way — guaranteed.
                </p>
              </div>

              {/* Delivery note */}
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-800 mb-1">⚡ Same-day delivery</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Order before 2 PM for delivery today anywhere in Nairobi.
                </p>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Search bar */}
            <div className="relative mb-5">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search chicken by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8290A]/20 focus:border-[#C8290A] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* ── Product grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : error ? (
                <ErrorState message={error} onRetry={fetchProducts} />
              ) : sorted.length === 0 ? (
                <EmptyState
                  search={search}
                  category={activeCategory}
                  onClear={() => { setSearch(""); setCategory("all"); }}
                />
              ) : (
                sorted.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>

            {/* ── Bulk orders CTA ── */}
            {!loading && !error && sorted.length > 0 && (
              <div className="mt-8 bg-[#C8290A] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <h3 className="text-white font-bold text-base mb-1">
                    📦 Need a large order?
                  </h3>
                  <p className="text-red-200 text-sm">
                    Hotels, restaurants, weddings — we handle bulk orders of any size.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="shrink-0 inline-flex items-center gap-2 bg-white text-[#C8290A] hover:bg-red-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors duration-150 whitespace-nowrap"
                >
                  Contact us
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky cart bar */}
      <CartBar />
    </div>
  );
}