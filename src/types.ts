export type OrderType = 'EAT_IN' | 'TAKE_OUT'

export interface Option { id: string; name: string; priceDelta: number }
export interface OptionGroup { id: string; name: string; required: boolean; options: Option[] }

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  desc: string
  price: number
  emoji: string
  image: string          // full URL
  optionGroups: OptionGroup[]
}

export interface Category { id: string; name: string }

export interface CartItem {
  lineId: string
  itemId: string
  name: string
  selected: Record<string, string>
  optionSummary: string
  unitPrice: number
  quantity: number
}
