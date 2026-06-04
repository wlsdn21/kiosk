import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MENU, CATEGORIES } from '../data/menu'
import { useCartStore } from '../store/useCartStore'
import CategoryTabs from '../components/CategoryTabs'
import MenuGrid from '../components/MenuGrid'

export default function Menu() {
  const nav = useNavigate()
  // 마지막으로 보던 카테고리 유지 (담기 후 메뉴로 돌아와도 같은 탭)
  const [cat, setCat] = useState(() => {
    const saved = sessionStorage.getItem('mm-cat')
    return saved && CATEGORIES.some((c) => c.id === saved) ? saved : CATEGORIES[0].id
  })
  const changeCat = (id: string) => {
    setCat(id)
    sessionStorage.setItem('mm-cat', id)
  }
  const orderType = useCartStore((s) => s.orderType)
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="flex items-center justify-between h-14 px-4 border-b border-neutral-100">
        <span className="font-bold">메이</span>
        <span className="text-sm text-neutral-400">{orderType === 'TAKE_OUT' ? '포장' : '매장'}</span>
      </header>
      <CategoryTabs active={cat} onChange={changeCat} />
      <MenuGrid items={MENU.filter((m) => m.categoryId === cat)} />
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ x: '-50%', y: 80, opacity: 0 }}
            animate={{ x: '-50%', y: 0, opacity: 1 }}
            exit={{ x: '-50%', y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 left-1/2 w-full max-w-kiosk p-4 bg-white border-t border-neutral-100"
          >
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => nav('/cart')}
              className="w-full h-14 rounded-2xl bg-brand text-white font-bold">
              장바구니 ({count})
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
