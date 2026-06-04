import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
      <div className="text-5xl">✅</div>
      <h1 className="text-xl font-bold">주문이 완료되었어요</h1>
      <p className="text-neutral-400">주문번호</p>
      <p className="text-3xl font-bold tracking-widest">{orderNumber}</p>
      <button onClick={() => nav('/')} className="mt-6 h-12 px-8 rounded-xl bg-brand text-white font-bold">처음으로</button>
    </div>
  )
}
