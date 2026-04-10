// src/store/cartStore.js
// Global cart state using Zustand.
// Import anywhere:  import { useCartStore } from "../store/cartStore"

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, name, price, image_url, category, quantity }]

      // ── Add item (or increment if already in cart) ──
      addItem(product) {
        const items = get().items;
        const existing = items.find((i) => i.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },

      // ── Remove item completely ──
      removeItem(id) {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      // ── Set specific quantity ──
      setQuantity(id, quantity) {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      // ── Clear entire cart ──
      clearCart() {
        set({ items: [] });
      },

      // ── Derived: total item count ──
      get totalCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      // ── Derived: total price in KSh ──
      get totalPrice() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
    }),
    {
      name: "kukumart-cart", // key in localStorage
    }
  )
);

// ── Convenience selectors ──
export const selectCartCount = (s) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const selectIsInCart = (id) => (s) =>
  s.items.some((i) => i.id === id);

export const selectItemQuantity = (id) => (s) =>
  s.items.find((i) => i.id === id)?.quantity ?? 0;