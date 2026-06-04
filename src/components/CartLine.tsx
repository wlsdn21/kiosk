import type { CartItem } from '../types'
import { formatKRW } from '../lib/money'
import { useCartStore } from '../store/useCartStore'
import { useNavigate } from 'react-router-dom'
import QtyStepper from './QtyStepper'

export default function CartLine({ item }: { item: CartItem }) {
  const nav = useNavigate()
  const { updateQty, removeItem } = useCartStore()
  return (
    <div className="flex justify-between gap-3 px-4 py-4 border-b border-neutral-100">
      <div className="flex-1">
        <div className="font-bold">{item.name}</div>
        {item.optionSummary && (
          <button onClick={() => nav(`/item/${item.itemId}`)} className="text-sm text-neutral-400 mt-0.5">
            {item.optionSummary} <span className="text-brand">변경 ›</span>
          </button>
        )}
        <div className="flex items-center gap-3 mt-2">
          <QtyStepper qty={item.quantity} onChange={(q) => updateQty(item.lineId, q)} />
          <button onClick={() => removeItem(item.lineId)} className="text-sm text-neutral-300">삭제</button>
        </div>
      </div>
      <div className="font-bold">{formatKRW(item.unitPrice * item.quantity)}</div>
    </div>
  )
}
