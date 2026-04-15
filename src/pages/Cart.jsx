// src/pages/Cart.jsx
// Customers review their cart items, adjust quantities, see the total,
// and proceed to the Checkout page.

import { Link, useNavigate } from "react-router-dom";
import {
  useCartStore,
  selectCartCount,
  selectCartTotal,
} from "../store/cartStore";
import { useAuthStore, selectIsLoggedIn } from "../store/authStore";

/* ── Category emoji lookup ── */
const CAT_EMOJI = {
  broiler_live:  "🐓",
  kienyeji_live: "🐔",
  slaughtered:   "🥩",
  fried_pieces:  "🍗",
  fried_whole:   "🍖",
};

/* ── Empty cart state ── */
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
        🛒
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          You haven't added any chicken yet. Head to the shop and pick something fresh!
        </p>
      </div>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 bg-[#C8290A] hover:bg-[#a82008] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors duration-150"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.99-1.72L23 6H6" />
        </svg>
        Browse the shop
      </Link>
    </div>
  );
}

/* ── Single cart item row ── */
function CartItem({ item }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem  = useCartStore((s) => s.removeItem);
  const emoji = CAT_EMOJI[item.category] ?? "🐔";

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Image / emoji thumb */}
      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <span className="text-2xl">{emoji}</span>
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          KSh {item.price.toLocaleString()} each
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shrink-0">
        <button
          onClick={() => setQuantity(item.id, item.quantity - 1)}
          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#C8290A] hover:bg-red-50 transition-colors font-bold text-lg"
          aria-label="Decrease"
        >−</button>
        <span className="w-7 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
        <button
          onClick={() => setQuantity(item.id, item.quantity + 1)}
          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#C8290A] hover:bg-red-50 transition-colors font-bold text-lg"
          aria-label="Increase"
        >+</button>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0 w-24">
        <p className="text-sm font-bold text-gray-900">
          KSh {(item.price * item.quantity).toLocaleString()}
        </p>
        <button
          onClick={() => removeItem(item.id)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-0.5"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/* ── Main Cart page ── */
export default function Cart() {
  const navigate   = useNavigate();
  const items      = useCartStore((s) => s.items);
  const count      = useCartStore(selectCartCount);
  const total      = useCartStore(selectCartTotal);
  const clearCart  = useCartStore((s) => s.clearCart);
  const isLoggedIn = useAuthStore(selectIsLoggedIn);

  const DELIVERY_FEE = 200; // Default — will be recalculated on Checkout via map
  const grandTotal   = total + DELIVERY_FEE;

  if (count === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            <Link to="/" className="hover:text-[#C8290A] transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#C8290A] transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Cart</span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Your cart
              <span className="ml-2 text-base font-medium text-gray-400">
                ({count} item{count !== 1 ? "s" : ""})
              </span>
            </h1>
            <button
              onClick={clearCart}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left — item list */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-2">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Continue shopping */}
            <Link
              to="/shop"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C8290A] hover:underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Continue shopping
            </Link>
          </div>

          {/* Right — order summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">Order summary</h2>

              {/* Line items summary */}
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-gray-900 font-medium shrink-0">
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 font-medium">KSh {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Delivery
                    <span className="text-xs text-gray-400 ml-1">(estimated)</span>
                  </span>
                  <span className="text-gray-900 font-medium">KSh {DELIVERY_FEE.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-[#C8290A] text-lg">
                  KSh {grandTotal.toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-2 mb-5">
                * Exact delivery fee calculated on the next step based on your location.
              </p>

              {/* Sign-in nudge for guests */}
              {!isLoggedIn && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="text-base shrink-0">👤</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">Sign in to checkout</p>
                    <p className="text-xs text-blue-600 mt-0.5">You'll need an account to place your order and track it.</p>
                    <Link to="/login?next=%2Fcheckout&reason=checkout"
                      className="inline-block mt-1.5 text-xs font-bold text-[#C8290A] hover:underline">
                      Sign in / Create account →
                    </Link>
                  </div>
                </div>
              )}

              {/* Proceed button */}
              <button
                onClick={() => isLoggedIn ? navigate("/checkout") : navigate("/login?next=%2Fcheckout&reason=checkout")}
                className="w-full flex items-center justify-center gap-2 bg-[#C8290A] hover:bg-[#a82008] active:bg-[#8a1a06] text-white font-bold text-sm py-3.5 rounded-xl transition-colors duration-150"
              >
                {isLoggedIn ? "Proceed to checkout" : "Sign in to checkout"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              {/* Trust signals */}
              <div className="mt-4 flex flex-col gap-2">
                {[
                  { icon: "🔒", text: "Secure checkout" },
                  { icon: "🕌", text: "Halal certified products" },
                  { icon: "⚡", text: "Same-day delivery available" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}