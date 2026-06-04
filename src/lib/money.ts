import type { OptionGroup } from '../types'

export const formatKRW = (n: number) => `${n.toLocaleString('ko-KR')}원`

export function unitPriceWithOptions(
  base: number, groups: OptionGroup[], selected: Record<string, string>,
): number {
  let total = base
  for (const g of groups) {
    const opt = g.options.find((o) => o.id === selected[g.id])
    if (opt) total += opt.priceDelta
  }
  return total
}
