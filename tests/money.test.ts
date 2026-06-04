import { describe, it, expect } from 'vitest'
import { formatKRW, unitPriceWithOptions } from '../src/lib/money'
import type { OptionGroup } from '../src/types'

const SIZE: OptionGroup = { id: 'size', name: '사이즈', required: true, options: [{ id: 'reg', name: '레귤러', priceDelta: 0 }, { id: 'large', name: '라지', priceDelta: 800 }] }

describe('money', () => {
  it('formatKRW', () => { expect(formatKRW(4800)).toBe('4,800원') })
  it('옵션 반영 단가', () => {
    expect(unitPriceWithOptions(4000, [SIZE], { size: 'large' })).toBe(4800)
    expect(unitPriceWithOptions(4000, [SIZE], { size: 'reg' })).toBe(4000)
  })
})
