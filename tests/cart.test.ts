import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../src/store/useCartStore'

const reset = () => useCartStore.setState({ orderType: null, items: [] })

describe('cart store', () => {
  beforeEach(reset)

  it('주문타입 설정', () => {
    useCartStore.getState().setOrderType('EAT_IN')
    expect(useCartStore.getState().orderType).toBe('EAT_IN')
  })

  it('항목 추가 + 합계', () => {
    useCartStore.getState().addItem({
      itemId: 'americano', name: '아메리카노', selected: { size: 'large', temp: 'hot' },
      optionSummary: '라지 · HOT', unitPrice: 4800, quantity: 2,
    })
    const s = useCartStore.getState()
    expect(s.items).toHaveLength(1)
    expect(s.total()).toBe(9600)
  })

  it('수량 변경/삭제/비우기', () => {
    const add = useCartStore.getState().addItem
    add({ itemId: 'latte', name: '카페라떼', selected: {}, optionSummary: '', unitPrice: 4800, quantity: 1 })
    const line = useCartStore.getState().items[0].lineId
    useCartStore.getState().updateQty(line, 3)
    expect(useCartStore.getState().total()).toBe(14400)
    useCartStore.getState().removeItem(line)
    expect(useCartStore.getState().items).toHaveLength(0)
    add({ itemId: 'x', name: 'x', selected: {}, optionSummary: '', unitPrice: 1000, quantity: 1 })
    useCartStore.getState().clear()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
