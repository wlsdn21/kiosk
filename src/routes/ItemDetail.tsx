import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { itemById } from '../data/menu'
import { useCartStore } from '../store/useCartStore'
import { unitPriceWithOptions, formatKRW } from '../lib/money'
import Header from '../components/Header'
import OptionGroup from '../components/OptionGroup'
import QtyStepper from '../components/QtyStepper'
import StickyButton from '../components/StickyButton'

export default function ItemDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const item = itemById(id ?? '')
  const addItem = useCartStore((s) => s.addItem)
  const [selected, setSelected] = useState<Record<string, string>>(
    () => Object.fromEntries((item?.optionGroups ?? []).map((g) => [g.id, g.options[0].id])),
  )
  const [qty, setQty] = useState(1)
  if (!item) return <div className="p-8 text-center">메뉴를 찾을 수 없어요</div>

  const unit = unitPriceWithOptions(item.price, item.optionGroups, selected)
  const add = () => {
    const summary = item.optionGroups
      .map((g) => g.options.find((o) => o.id === selected[g.id])?.name)
      .filter(Boolean).join(' · ')
    addItem({ itemId: item.id, name: item.name, selected, optionSummary: summary, unitPrice: unit, quantity: qty })
    nav('/menu')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={item.name} />
      <div className="flex-1">
        <img src={item.image} alt={item.name} className="w-full aspect-[4/3] object-cover" />
        <div className="px-4 py-4">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <p className="text-neutral-400 mt-1">{item.desc}</p>
          <p className="text-lg font-bold mt-2">{formatKRW(item.price)}</p>
        </div>
        {item.optionGroups.map((g) => (
          <OptionGroup key={g.id} group={g} value={selected[g.id]}
            onChange={(opt) => setSelected((s) => ({ ...s, [g.id]: opt }))} />
        ))}
        <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
          <span className="text-sm text-neutral-400">수량</span>
          <QtyStepper qty={qty} onChange={(q) => setQty(Math.max(1, q))} />
        </div>
      </div>
      <StickyButton label="담기" amount={formatKRW(unit * qty)} onClick={add} />
    </div>
  )
}
