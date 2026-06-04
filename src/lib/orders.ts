import { supabase } from './supabase'
import type { CartItem, OrderType } from '../types'

export interface NewOrder {
  orderId: string
  orderNumber: string
  orderType: OrderType
  items: CartItem[]
  totalAmount: number
}

export async function createPendingOrder(o: NewOrder): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    order_id: o.orderId,
    order_number: o.orderNumber,
    order_type: o.orderType,
    items: o.items,
    total_amount: o.totalAmount,
    status: 'pending',
  })
  if (error) throw error
}

export async function confirmPayment(args: { paymentKey: string; orderId: string; amount: number }) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(args),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? '결제 승인 실패')
  return data as { ok: true; orderId: string; approvedAt: string | null }
}
