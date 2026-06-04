import { describe, it, expect } from 'vitest'
import { MENU, CATEGORIES, itemById } from '../src/data/menu'

describe('menu data', () => {
  it('27개 항목, 카테고리 5개', () => {
    expect(MENU.length).toBe(27)
    expect(CATEGORIES.length).toBe(5)
  })
  it('모든 항목의 categoryId가 유효', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id))
    expect(MENU.every((m) => ids.has(m.categoryId))).toBe(true)
  })
  it('아메리카노는 4000원, size+temp', () => {
    const a = itemById('americano')!
    expect(a.price).toBe(4000)
    expect(a.optionGroups.map((g) => g.id)).toEqual(['size', 'temp'])
  })
  it('에스프레소/디저트는 옵션 없음', () => {
    expect(itemById('espresso')!.optionGroups).toEqual([])
    expect(itemById('cheesecake')!.optionGroups).toEqual([])
  })
})
