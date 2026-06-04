import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MENU, CATEGORIES } from '../data/menu'
import { useCartStore } from '../store/useCartStore'
import CategoryTabs from '../components/CategoryTabs'
import MenuGrid from '../components/MenuGrid'

export default function Menu() {
  const nav = useNavigate()
  const [cat, setCat] = useState(CATEGORIES[0].id)
  const orderType = useCartStore((s) => s.orderType)
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="flex items-center justify-between h-14 px-4 border-b border-neutral-100">
        <span className="font-bold">메이</span>
        <span className="text-sm text-neutral-400">{orderType === 'TAKE_OUT' ? '포장' : '매장'}</span>
      </header>
      <CategoryTabs active={cat} onChange={setCat} />
      <MenuGrid items={MENU.filter((m) => m.categoryId === cat)} />
      {count > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-kiosk p-4 bg-white border-t border-neutral-100">
          <button onClick={() => nav('/cart')} className="w-full h-14 rounded-2xl bg-brand text-white font-bold">
            장바구니 ({count})
          </button>
        </div>
      )}
    </div>
  )
}
