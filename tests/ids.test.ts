import { describe, it, expect } from 'vitest'
import { makeOrderId, makeOrderNumber } from '../src/lib/ids'

describe('ids', () => {
  it('orderId는 order_ 접두 + 유니크', () => {
    const a = makeOrderId(); const b = makeOrderId()
    expect(a).toMatch(/^order_/)
    expect(a).not.toBe(b)
  })
  it('orderNumber는 4자리 영숫자', () => {
    expect(makeOrderNumber()).toMatch(/^[A-Z0-9]{4}$/)
  })
})
