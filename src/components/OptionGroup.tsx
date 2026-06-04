import type { OptionGroup as OG } from '../types'
import { formatKRW } from '../lib/money'

export default function OptionGroup({ group, value, onChange }: {
  group: OG; value: string; onChange: (optId: string) => void
}) {
  return (
    <div className="px-4 py-4 border-t border-neutral-100">
      <div className="text-sm text-neutral-400 mb-2">{group.name} {group.required && '· 필수'}</div>
      {group.options.map((o) => (
        <label key={o.id} className="flex items-center justify-between py-2.5 cursor-pointer">
          <span className="flex items-center gap-3">
            <input type="radio" name={group.id} checked={value === o.id}
              onChange={() => onChange(o.id)} className="accent-brand w-5 h-5" />
            {o.name}
          </span>
          {o.priceDelta > 0 && <span className="text-neutral-400">+{formatKRW(o.priceDelta)}</span>}
        </label>
      ))}
    </div>
  )
}
