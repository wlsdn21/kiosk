import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import type { MenuItem } from '../types'
import { formatKRW } from '../lib/money'

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export default function MenuCard({ item: menuItem }: { item: MenuItem }) {
  const nav = useNavigate()
  return (
    <motion.button
      variants={item}
      whileTap={{ scale: 0.96 }}
      onClick={() => nav(`/item/${menuItem.id}`)}
      className="text-left"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
        <img src={menuItem.image} alt={menuItem.name} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-2 left-2 text-lg">{menuItem.emoji}</span>
      </div>
      <div className="mt-2 font-medium text-sm">{menuItem.name}</div>
      <div className="text-sm text-neutral-500">{formatKRW(menuItem.price)}</div>
    </motion.button>
  )
}
