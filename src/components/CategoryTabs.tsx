import { CATEGORIES } from '../data/menu'

export default function CategoryTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-neutral-100">
      {CATEGORIES.map((c) => (
        <button key={c.id} onClick={() => onChange(c.id)}
          className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium ${
            active === c.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>
          {c.name}
        </button>
      ))}
    </div>
  )
}
