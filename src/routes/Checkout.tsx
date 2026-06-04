import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '../store/useCartStore'
import { formatKRW } from '../lib/money'
import { makeOrderId, makeOrderNumber } from '../lib/ids'
import { createPendingOrder } from '../lib/orders'
import { mountPaymentWidget } from '../lib/payments'
import Header from '../components/Header'

export default function Checkout() {
  const { items, total, orderType } = useCartStore()
  const amount = total()
  const widgetsRef = useRef<Awaited<ReturnType<typeof mountPaymentWidget>> | null>(null)
  const orderRef = useRef<{ orderId: string; orderNumber: string } | null>(null)
  const mountedRef = useRef(false)
  const orderInsertedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    if (amount <= 0) return
    // 토스 위젯은 한 번만 마운트한다 (StrictMode dev 이중 호출 시 약관 위젯 중복 에러 방지)
    if (mountedRef.current) return
    mountedRef.current = true
    orderRef.current = { orderId: makeOrderId(), orderNumber: makeOrderNumber() }
    mountPaymentWidget('#toss-methods', '#toss-agreement', amount).then((w) => {
      widgetsRef.current = w
      setReady(true)
    })
  }, [amount])

  const pay = async () => {
    const o = orderRef.current
    const w = widgetsRef.current
    if (!o || !w) return
    setPayError(null)
    try {
      // 주문은 한 번만 insert (requestPayment가 던져도 같은 orderId 중복 insert 방지)
      if (!orderInsertedRef.current) {
        await createPendingOrder({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          orderType: orderType!,
          items,
          totalAmount: amount,
        })
        orderInsertedRef.current = true
      }
      sessionStorage.setItem('mm-order-number', o.orderNumber)
      await w.requestPayment({
        orderId: o.orderId,
        orderName: items[0] ? `${items[0].name} 외 ${items.length - 1}건` : '주문',
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/checkout`,
      })
    } catch (e) {
      setPayError(e instanceof Error ? e.message : '결제 중 오류가 발생했어요. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="결제하기" />
      <div className="flex-1">
        <div className="px-4 py-4 border-b border-neutral-100">
          {items.map((it) => (
            <div key={it.lineId} className="flex justify-between py-1">
              <span>
                {it.name} × {it.quantity}
                <span className="block text-sm text-neutral-400">{it.optionSummary}</span>
              </span>
              <span>{formatKRW(it.unitPrice * it.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 font-bold">
            <span>총 결제금액</span>
            <span>{formatKRW(amount)}</span>
          </div>
        </div>
        <div id="toss-methods" />
        <div id="toss-agreement" />
      </div>
      <div className="sticky bottom-0 p-4 bg-white border-t border-neutral-100">
        {payError && <p className="mb-2 text-sm text-center text-red-500">{payError}</p>}
        <button
          onClick={pay}
          disabled={!ready}
          className="w-full h-14 rounded-2xl bg-brand text-white font-bold disabled:opacity-40"
        >
          {formatKRW(amount)} 결제하기
        </button>
      </div>
    </div>
  )
}
