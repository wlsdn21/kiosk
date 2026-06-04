import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// 화면 전환: opacity 위주의 은은한 페이드.
// (sticky/fixed 레이아웃이 깨지지 않도록 큰 transform은 피한다)
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
