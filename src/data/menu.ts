import type { MenuItem, OptionGroup, Category } from '../types'
import raw from './menu-data.json'

const img = (photoId: string) => `https://images.unsplash.com/photo-${photoId}?w=400&q=70`

export const CATEGORIES: Category[] = [
  { id: 'coffee', name: '커피' },
  { id: 'latte', name: '라떼·티' },
  { id: 'ade', name: '에이드·스무디' },
  { id: 'dessert', name: '디저트' },
  { id: 'season', name: '시즌' },
]

const SIZE: OptionGroup = {
  id: 'size', name: '사이즈', required: true,
  options: [{ id: 'reg', name: '레귤러', priceDelta: 0 }, { id: 'large', name: '라지', priceDelta: 800 }],
}
const TEMP: OptionGroup = {
  id: 'temp', name: '온도', required: true,
  options: [{ id: 'hot', name: 'HOT', priceDelta: 0 }, { id: 'ice', name: 'ICE', priceDelta: 0 }],
}
const GROUPS: Record<string, OptionGroup> = { size: SIZE, temp: TEMP }

type RawItem = { id: string; categoryId: string; name: string; desc: string; price: number; emoji: string; image: string; optionGroups: string[] }

export const MENU: MenuItem[] = (raw as RawItem[]).map((r) => ({
  ...r,
  image: img(r.image),
  optionGroups: r.optionGroups.map((g) => GROUPS[g]),
}))

export const itemById = (id: string) => MENU.find((m) => m.id === id)
