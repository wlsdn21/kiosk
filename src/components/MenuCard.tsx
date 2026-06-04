import { useNavigate } from 'react-router-dom'
import type { MenuItem } from '../types'
import { formatKRW } from '../lib/money'

export default function MenuCard({ item }: { item: MenuItem }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(`/item/${item.id}`)} className="text-left">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-2 left-2 text-lg">{item.emoji}</span>
      </div>
      <div className="mt-2 font-medium text-sm">{item.name}</div>
      <div className="text-sm text-neutral-500">{formatKRW(item.price)}</div>
    </button>
  )
}
