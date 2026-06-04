import { motion } from 'framer-motion'

export default function StickyButton({ label, amount, onClick, disabled }: {
  label: string; amount?: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <div className="sticky bottom-0 p-4 bg-white border-t border-neutral-100">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-brand text-white font-bold disabled:opacity-40"
      >
        <span>{label}</span>
        {amount && <span>{amount}</span>}
      </motion.button>
    </div>
  )
}
