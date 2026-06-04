import type { MenuItem } from '../types'
import MenuCard from './MenuCard'

export default function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {items.map((it) => <MenuCard key={it.id} item={it} />)}
    </div>
  )
}
