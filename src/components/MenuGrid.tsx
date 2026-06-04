import { motion, type Variants } from 'framer-motion'
import type { MenuItem } from '../types'
import MenuCard from './MenuCard'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <motion.div
      // key를 카테고리 구성으로 바꿔, 탭 전환 시 다시 등장하도록
      key={items.map((i) => i.id).join(',')}
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 p-4"
    >
      {items.map((it) => <MenuCard key={it.id} item={it} />)}
    </motion.div>
  )
}
