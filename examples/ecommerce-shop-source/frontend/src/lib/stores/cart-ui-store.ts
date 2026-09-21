/**
 * Cart UI Store — manages open/close state of CartModal
 * Kept separate so cart data and UI state don't mix
 */
import { create } from "zustand";

interface CartUiStore {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartUiStore = create<CartUiStore>((set) => ({
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
}));
