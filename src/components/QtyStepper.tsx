import { motion } from 'framer-motion'

export default function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => onChange(qty - 1)}
        className="w-9 h-9 rounded-full border border-neutral-200 text-xl">−</motion.button>
      <motion.span key={qty} initial={{ scale: 0.7, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }} className="w-6 text-center font-bold">{qty}</motion.span>
      <motion.button whileTap={{ scale: 0.85 }} onClick={() => onChange(qty + 1)}
        className="w-9 h-9 rounded-full border border-neutral-200 text-xl">+</motion.button>
    </div>
  )
}
