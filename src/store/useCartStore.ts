import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, OrderType } from '../types'

interface CartState {
  orderType: OrderType | null
  items: CartItem[]
  setOrderType: (t: OrderType) => void
  addItem: (i: Omit<CartItem, 'lineId'>) => void
  updateQty: (lineId: string, qty: number) => void
  removeItem: (lineId: string) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      orderType: null,
      items: [],
      setOrderType: (t) => set({ orderType: t }),
      addItem: (i) =>
        set((s) => ({ items: [...s.items, { ...i, lineId: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }] })),
      updateQty: (lineId, qty) =>
        set((s) => ({ items: s.items.map((it) => (it.lineId === lineId ? { ...it, quantity: Math.max(1, qty) } : it)) })),
      removeItem: (lineId) => set((s) => ({ items: s.items.filter((it) => it.lineId !== lineId) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    }),
    { name: 'mm-kiosk-cart' },
  ),
)
