import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import { formatKRW } from '../lib/money'
import Header from '../components/Header'
import CartLine from '../components/CartLine'
import StickyButton from '../components/StickyButton'

export default function Cart() {
  const nav = useNavigate()
  const { items, total } = useCartStore()

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="장바구니" />
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400">장바구니가 비었어요</div>
      ) : (
        <>
          <div className="flex-1">
            {items.map((it) => <CartLine key={it.lineId} item={it} />)}
            <div className="flex justify-between px-4 py-5 font-bold">
              <span>총 결제금액</span><span>{formatKRW(total())}</span>
            </div>
          </div>
          <StickyButton label="결제하기" amount={formatKRW(total())} onClick={() => nav('/checkout')} />
        </>
      )}
    </div>
  )
}
