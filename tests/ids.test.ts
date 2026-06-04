import { describe, it, expect } from 'vitest'
import { makeOrderId, makeOrderNumber } from '../src/lib/ids'

describe('ids', () => {
  it('orderId는 order_ 접두 + 유니크', () => {
    const a = makeOrderId(); const b = makeOrderId()
    expect(a).toMatch(/^order_/)
    expect(a).not.toBe(b)
  })
  it('orderNumber는 오늘 N번째 (1부터 증가)', () => {
    localStorage.clear()
    expect(makeOrderNumber()).toBe('1')
    expect(makeOrderNumber()).toBe('2')
    expect(makeOrderNumber()).toBe('3')
  })
})
