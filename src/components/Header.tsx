import { useNavigate } from 'react-router-dom'

export default function Header({ title, back = true }: { title: string; back?: boolean }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-10 flex items-center h-14 px-3 bg-white border-b border-neutral-100">
      {back && (
        <button onClick={() => nav(-1)} className="w-9 h-9 -ml-1 text-2xl text-neutral-500" aria-label="뒤로">‹</button>
      )}
      <h1 className="flex-1 text-center text-base font-bold pr-8">{title}</h1>
    </header>
  )
}
