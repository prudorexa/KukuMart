// src/components/ProductCard.jsx
// Reusable product card — used on Shop page and can be used on Homepage featured section.

import { useState } from "react";
import { useCartStore, selectIsInCart, selectItemQuantity } from "../store/cartStore";

// Category display config
const CATEGORY_CONFIG = {
  broiler_live:   { label: "Live broiler",   emoji: "🐓", tagClass: "bg-green-100 text-green-800" },
  kienyeji_live:  { label: "Live kienyeji",  emoji: "🐔", tagClass: "bg-green-100 text-green-800" },
  slaughtered:    { label: "Ready to cook",  emoji: "🥩", tagClass: "bg-orange-100 text-orange-800" },
  fried_pieces:   { label: "Ready to eat",   emoji: "🍗", tagClass: "bg-red-100 text-red-800" },
  fried_whole:    { label: "Ready to eat",   emoji: "🍖", tagClass: "bg-red-100 text-red-800" },
};

export default function ProductCard({ product }) {
  const { id, name, description, price, category, image_url, in_stock, weight_kg } = product;

  const addItem      = useCartStore((s) => s.addItem);
  const removeItem   = useCartStore((s) => s.removeItem);
  const setQuantity  = useCartStore((s) => s.setQuantity);
  const inCart       = useCartStore(selectIsInCart(id));
  const qty          = useCartStore(selectItemQuantity(id));

  const [imgError, setImgError] = useState(false);

  const config = CATEGORY_CONFIG[category] ?? {
    label: category,
    emoji: "🐔",
    tagClass: "bg-gray-100 text-gray-700",
  };

  const formattedPrice = `KSh ${price.toLocaleString()}`;

  function handleAdd() {
    addItem({ id, name, price, image_url, category });
  }

  return (
    <div className={`group relative bg-white rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md ${
      !in_stock ? "opacity-60" : "border-gray-200 hover:border-[#C8290A]/20"
    }`}>

      {/* ── Product image ── */}
      <div className="relative w-full aspect-4/3 bg-gray-50 overflow-hidden">
        {image_url && !imgError ? (
          <img
            src={image_url}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // Placeholder when no image or image fails to load
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-5xl">{config.emoji}</span>
            <span className="text-xs text-gray-400 font-medium">{config.label}</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {!in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Out of stock
            </span>
          </div>
        )}

        {/* Category tag */}
        <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full ${config.tagClass}`}>
          {config.label}
        </span>
      </div>

      {/* ── Product details ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 leading-snug">{name}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
          {weight_kg && (
            <p className="text-xs text-gray-400 mt-1">~{weight_kg} kg</p>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-base font-bold text-[#C8290A]">{formattedPrice}</span>
          {in_stock && (
            <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              In stock
            </span>
          )}
        </div>

        {/* ── Add to cart / Quantity control ── */}
        {in_stock && (
          <div className="mt-2">
            {!inCart ? (
              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] active:bg-[#8a1a06] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-150"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
                </svg>
                Add to cart
              </button>
            ) : (
              // Quantity stepper when already in cart
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(id, qty - 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#C8290A] hover:bg-red-50 transition-colors duration-150 font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-sm font-bold text-gray-900 min-w-24px text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQuantity(id, qty + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-[#C8290A] hover:bg-red-50 transition-colors duration-150 font-bold text-lg"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}