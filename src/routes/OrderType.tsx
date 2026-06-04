import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCartStore } from '../store/useCartStore'
import type { OrderType as OT } from '../types'

const OPTIONS: { type: OT; emoji: string; title: string; sub: string }[] = [
  { type: 'EAT_IN', emoji: '🍽️', title: '매장에서 먹기', sub: '매장에서 드시고 가요' },
  { type: 'TAKE_OUT', emoji: '🥡', title: '포장하기', sub: '주문번호로 받아가기' },
]

export default function OrderType() {
  const nav = useNavigate()
  const setOrderType = useCartStore((s) => s.setOrderType)
  const choose = (t: OT) => { setOrderType(t); nav('/menu') }

  return (
    <div className="flex flex-col min-h-screen justify-center px-6 gap-3">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">☕</div>
        <h1 className="text-2xl font-bold">메이</h1>
        <p className="text-neutral-400 mt-1">주문 방식을 선택해 주세요</p>
      </div>
      {OPTIONS.map((o, i) => (
        <motion.button key={o.type} onClick={() => choose(o.type)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.3, ease: 'easeOut' }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-200 text-left">
          <span className="text-2xl">{o.emoji}</span>
          <span className="flex-1">
            <span className="block font-bold">{o.title}</span>
            <span className="block text-sm text-neutral-400">{o.sub}</span>
          </span>
          <span className="text-neutral-300">›</span>
        </motion.button>
      ))}
    </div>
  )
}
