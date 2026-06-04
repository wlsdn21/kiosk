import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { confirmPayment } from '../lib/orders'
import { useCartStore } from '../store/useCartStore'

export default function Success() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const clear = useCartStore((s) => s.clear)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState('')
  const orderNumber = sessionStorage.getItem('mm-order-number') ?? ''

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = Number(params.get('amount'))
    if (!paymentKey || !orderId || !amount) { setState('error'); setMsg('결제 정보가 없습니다.'); return }
    confirmPayment({ paymentKey, orderId, amount })
      .then(() => { setState('ok'); clear() })
      .catch((e) => { setState('error'); setMsg(String(e?.message ?? e)) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center">결제 확인 중…</div>
  if (state === 'error') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl">⚠️</div><p>{msg}</p>
      <button onClick={() => nav('/cart')} className="h-12 px-6 rounded-xl bg-neutral-100">장바구니로</button>
    </div>
  )
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="text-5xl"
      >✅</motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }} className="text-xl font-bold"
      >주문이 완료되었어요</motion.h1>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}
        className="text-neutral-400"
      >주문번호</motion.p>
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 14 }}
        className="text-3xl font-bold tracking-widest"
      >{orderNumber}</motion.p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        onClick={() => nav('/')} className="mt-6 h-12 px-8 rounded-xl bg-brand text-white font-bold"
      >처음으로</motion.button>
    </div>
  )
}
