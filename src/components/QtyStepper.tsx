export default function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={() => onChange(qty - 1)} className="w-9 h-9 rounded-full border border-neutral-200 text-xl">−</button>
      <span className="w-6 text-center font-bold">{qty}</span>
      <button onClick={() => onChange(qty + 1)} className="w-9 h-9 rounded-full border border-neutral-200 text-xl">+</button>
    </div>
  )
}
