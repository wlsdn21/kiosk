# marketmay 키오스크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라이브 키오스크(`marketmay-kiosk.pages.dev`)를 Vite+React로 그대로 복제하고, 결제 전 주문을 Supabase `orders`에 저장한다.

**Architecture:** 메뉴는 프론트 하드코딩(라이브 번들에서 추출 완료, `docs/superpowers/plans/assets/menu-data.json` 27개). 장바구니는 zustand(persist). 결제는 토스 위젯 v2(테스트키) → 기존 Supabase Edge Function `confirm-payment` 호출. 주문은 결제 직전 `orders`에 `pending` insert, 함수가 `paid`로 갱신.

**Tech Stack:** Vite, React 19, TypeScript, react-router-dom v7, Tailwind CSS, zustand, @tosspayments/tosspayments-sdk, @supabase/supabase-js, vitest + @testing-library/react.

상세 설계: [docs/superpowers/specs/2026-06-04-marketmay-kiosk-design.md](../specs/2026-06-04-marketmay-kiosk-design.md)

---

## File Structure

```
kiosk/
  index.html
  package.json, vite.config.ts, tsconfig*.json, tailwind.config.js, postcss.config.js
  .env.example
  src/
    main.tsx                # 라우터 mount
    App.tsx                 # <Routes>
    index.css               # tailwind + 토큰
    types.ts                # MenuItem, Option, CartItem, OrderType, NewOrder
    data/menu.ts            # 27개 메뉴 + 카테고리 + 옵션그룹 + 이미지 헬퍼
    store/useCartStore.ts   # 주문타입 + items + 합계 (persist)
    lib/
      money.ts              # formatKRW, lineTotal
      ids.ts               # makeOrderId, makeOrderNumber
      supabase.ts          # supabase 클라이언트
      orders.ts            # createPendingOrder, confirmPayment
      payments.ts          # 토스 위젯 init + requestPayment
    components/
      Header.tsx, StickyButton.tsx
      CategoryTabs.tsx, MenuGrid.tsx, MenuCard.tsx
      OptionGroup.tsx, QtyStepper.tsx, CartLine.tsx
    routes/
      OrderType.tsx, Menu.tsx, ItemDetail.tsx, Cart.tsx, Checkout.tsx, Success.tsx
  supabase/migrations/0001_orders.sql
  tests/                   # 단위 테스트 (money, ids, cart store, 가격계산)
```

---

## Task 0: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.env.example`

- [ ] **Step 1: Vite 프로젝트 생성 (현재 빈 repo 안에서)**

Run:
```bash
cd ~/code/kiosk
npm create vite@latest . -- --template react-ts
# 기존 파일 유지 질문 시 'Ignore files and continue' 선택
npm install
npm install react-router-dom zustand @supabase/supabase-js @tosspayments/tosspayments-sdk
npm install -D tailwindcss@^3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
npx tailwindcss init -p
```

- [ ] **Step 2: Tailwind 설정**

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { brand: { DEFAULT: '#1a9e5f', dark: '#168a52' } },
      maxWidth: { kiosk: '480px' },
    },
  },
  plugins: [],
}
```

`src/index.css` (기존 내용 대체):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html { color-scheme: light; }
body { @apply bg-neutral-100 text-neutral-900; }
#root { @apply mx-auto max-w-kiosk min-h-screen bg-white; }
```

- [ ] **Step 3: vitest 설정**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], globals: true },
})
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

`package.json` scripts에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: index.html 메타 (라이브와 동일)**

`index.html` `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="color-scheme" content="light" />
<meta name="apple-mobile-web-app-title" content="메이" />
<title>메이 · 주문하기</title>
```

- [ ] **Step 5: 라우터 골격**

`src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OrderType from './routes/OrderType'
import Menu from './routes/Menu'
import ItemDetail from './routes/ItemDetail'
import Cart from './routes/Cart'
import Checkout from './routes/Checkout'
import Success from './routes/Success'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OrderType />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </BrowserRouter>
  )
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
```

각 route 파일은 임시 stub(`export default function X(){return <div/>}`)로 먼저 만들어 컴파일을 통과시킨다.

- [ ] **Step 6: 빌드 확인 후 커밋**

Run: `npm run build`
Expected: 빌드 성공 (stub 화면).
```bash
git add -A && git commit -m "chore: scaffold vite react kiosk"
```

---

## Task 1: 타입 + 메뉴 데이터

**Files:**
- Create: `src/types.ts`, `src/data/menu.ts`
- Source: `docs/superpowers/plans/assets/menu-data.json` (27개 실데이터)

- [ ] **Step 1: 타입 정의**

`src/types.ts`:
```ts
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
  image: string          // 완성 URL
  optionGroups: OptionGroup[]
}

export interface Category { id: string; name: string }

export interface CartItem {
  lineId: string
  itemId: string
  name: string
  selected: Record<string, string>   // groupId -> optionId
  optionSummary: string              // "레귤러 · HOT"
  unitPrice: number                  // 옵션 반영 단가
  quantity: number
}
```

- [ ] **Step 2: 옵션그룹 + 카테고리 + 이미지 헬퍼**

`src/data/menu.ts` 상단:
```ts
import type { MenuItem, OptionGroup, Category } from '../types'

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
```

- [ ] **Step 3: 27개 메뉴 데이터 생성**

`docs/superpowers/plans/assets/menu-data.json`의 각 항목을 아래 형태로 변환해 `MENU`로 export. `optionGroups` 문자열 배열(`["size","temp"]` 등)은 `GROUPS[x]`로 매핑, `image`는 `img(photoId)`로 감싼다.

```ts
type RawItem = { id: string; categoryId: string; name: string; desc: string; price: number; emoji: string; image: string; optionGroups: string[] }
import raw from '../../docs/superpowers/plans/assets/menu-data.json'   // 또는 src로 복사 후 import

export const MENU: MenuItem[] = (raw as RawItem[]).map((r) => ({
  ...r,
  image: img(r.image),
  optionGroups: r.optionGroups.map((g) => GROUPS[g]),
}))

export const itemById = (id: string) => MENU.find((m) => m.id === id)
```
> 빌드시 JSON import가 번거로우면, 변환 결과를 펼쳐 정적 배열로 인라인해도 된다(데이터 27개 고정). 어느 쪽이든 결과 객체 구조는 위 `MenuItem`과 일치해야 한다. 참고 분류: 옵션없음=espresso+디저트8, size만=coldbrew/grapefruit-ade/grape-ade/strawberry-smoothie/einspanner/peach-tea, temp만=earlgrey/chamomile, 나머지=size+temp.

- [ ] **Step 4: 데이터 무결성 테스트**

`tests/menu.test.ts`:
```ts
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
```

- [ ] **Step 5: 테스트 실행 → 커밋**

Run: `npm test -- menu`
Expected: PASS (4 tests)
```bash
git add -A && git commit -m "feat: menu data + types (27 items from live bundle)"
```

---

## Task 2: money / ids 유틸 (TDD)

**Files:**
- Create: `src/lib/money.ts`, `src/lib/ids.ts`
- Test: `tests/money.test.ts`, `tests/ids.test.ts`

- [ ] **Step 1: money 테스트 작성**

`tests/money.test.ts`:
```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- money`
Expected: FAIL (module not found)

- [ ] **Step 3: 구현**

`src/lib/money.ts`:
```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- money`
Expected: PASS

- [ ] **Step 5: ids 테스트 + 구현**

`tests/ids.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { makeOrderId, makeOrderNumber } from '../src/lib/ids'

describe('ids', () => {
  it('orderId는 order_ 접두 + 유니크', () => {
    const a = makeOrderId(); const b = makeOrderId()
    expect(a).toMatch(/^order_/)
    expect(a).not.toBe(b)
  })
  it('orderNumber는 3자리 이상 표시문자열', () => {
    expect(makeOrderNumber()).toMatch(/^[A-Z0-9]{4}$/)
  })
})
```

`src/lib/ids.ts`:
```ts
export const makeOrderId = () =>
  `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const makeOrderNumber = () =>
  Array.from({ length: 4 }, () => CH[Math.floor(Math.random() * CH.length)]).join('')
```

- [ ] **Step 6: 실행 → 커밋**

Run: `npm test -- money ids`
Expected: PASS
```bash
git add -A && git commit -m "feat: money + ids utils (TDD)"
```

---

## Task 3: 장바구니 store (TDD)

**Files:**
- Create: `src/store/useCartStore.ts`
- Test: `tests/cart.test.ts`

- [ ] **Step 1: 테스트 작성**

`tests/cart.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../src/store/useCartStore'

const reset = () => useCartStore.setState({ orderType: null, items: [] })

describe('cart store', () => {
  beforeEach(reset)

  it('주문타입 설정', () => {
    useCartStore.getState().setOrderType('EAT_IN')
    expect(useCartStore.getState().orderType).toBe('EAT_IN')
  })

  it('항목 추가 + 합계', () => {
    useCartStore.getState().addItem({
      itemId: 'americano', name: '아메리카노', selected: { size: 'large', temp: 'hot' },
      optionSummary: '라지 · HOT', unitPrice: 4800, quantity: 2,
    })
    const s = useCartStore.getState()
    expect(s.items).toHaveLength(1)
    expect(s.total()).toBe(9600)
  })

  it('수량 변경/삭제/비우기', () => {
    const add = useCartStore.getState().addItem
    add({ itemId: 'latte', name: '카페라떼', selected: {}, optionSummary: '', unitPrice: 4800, quantity: 1 })
    const line = useCartStore.getState().items[0].lineId
    useCartStore.getState().updateQty(line, 3)
    expect(useCartStore.getState().total()).toBe(14400)
    useCartStore.getState().removeItem(line)
    expect(useCartStore.getState().items).toHaveLength(0)
    add({ itemId: 'x', name: 'x', selected: {}, optionSummary: '', unitPrice: 1000, quantity: 1 })
    useCartStore.getState().clear()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- cart`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/store/useCartStore.ts`:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, OrderType } from '../types'

interface CartState {
  orderType: OrderType | null
  items: CartItem[]
  setOrderType: (t: OrderType) => void
  addItem: (i: Omit<CartItem, 'lineId'>) => void
  updateQty: (lineId: string, qty: number) => void
  removeItem: (lineId: string) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      orderType: null,
      items: [],
      setOrderType: (t) => set({ orderType: t }),
      addItem: (i) =>
        set((s) => ({ items: [...s.items, { ...i, lineId: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }] })),
      updateQty: (lineId, qty) =>
        set((s) => ({ items: s.items.map((it) => (it.lineId === lineId ? { ...it, quantity: Math.max(1, qty) } : it)) })),
      removeItem: (lineId) => set((s) => ({ items: s.items.filter((it) => it.lineId !== lineId) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    }),
    { name: 'mm-kiosk-cart' },
  ),
)
```

- [ ] **Step 4: 통과 → 커밋**

Run: `npm test -- cart`
Expected: PASS
```bash
git add -A && git commit -m "feat: cart store with persist (TDD)"
```

---

## Task 4: 공용 UI (Header, StickyButton)

**Files:**
- Create: `src/components/Header.tsx`, `src/components/StickyButton.tsx`

- [ ] **Step 1: Header 구현**

`src/components/Header.tsx`:
```tsx
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
```

- [ ] **Step 2: StickyButton 구현**

`src/components/StickyButton.tsx`:
```tsx
export default function StickyButton({ label, amount, onClick, disabled }: {
  label: string; amount?: string; onClick: () => void; disabled?: boolean
}) {
  return (
    <div className="sticky bottom-0 p-4 bg-white border-t border-neutral-100">
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-brand text-white font-bold disabled:opacity-40"
      >
        <span>{label}</span>
        {amount && <span>{amount}</span>}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: 빌드 확인 → 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add -A && git commit -m "feat: Header + StickyButton"
```

---

## Task 5: 주문방식 선택 화면 `/`

**Files:**
- Modify: `src/routes/OrderType.tsx`

- [ ] **Step 1: 구현**

`src/routes/OrderType.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import type { OrderType as OT } from '../types'

const OPTIONS: { type: OT; emoji: string; title: string; sub: string }[] = [
  { type: 'EAT_IN', emoji: '🍽️', title: '매장에서 먹기', sub: '매장에서 드시고 가요' },
  { type: 'TAKE_OUT', emoji: '🥡', title: '포장하기', sub: '주문번호로 받아가기' },
]

export default function OrderType() {
  const nav = useNavigate()
  const setOrderType = useCartStore((s) => s.setOrderType)
  const choose = (t: OT) => { setOrderType(t); nav('/menu') }

  return (
    <div className="flex flex-col min-h-screen justify-center px-6 gap-3">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">☕</div>
        <h1 className="text-2xl font-bold">메이</h1>
        <p className="text-neutral-400 mt-1">주문 방식을 선택해 주세요</p>
      </div>
      {OPTIONS.map((o) => (
        <button key={o.type} onClick={() => choose(o.type)}
          className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-200 text-left">
          <span className="text-2xl">{o.emoji}</span>
          <span className="flex-1">
            <span className="block font-bold">{o.title}</span>
            <span className="block text-sm text-neutral-400">{o.sub}</span>
          </span>
          <span className="text-neutral-300">›</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 검증 → 커밋**

Run: `npm run dev` 후 `/`에서 카드 클릭 → `/menu` 이동, orderType 저장 확인.
```bash
git add -A && git commit -m "feat: order type screen (/)"
```

---

## Task 6: 메뉴 화면 `/menu`

**Files:**
- Create: `src/components/CategoryTabs.tsx`, `src/components/MenuCard.tsx`, `src/components/MenuGrid.tsx`
- Modify: `src/routes/Menu.tsx`

- [ ] **Step 1: CategoryTabs**

`src/components/CategoryTabs.tsx`:
```tsx
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
```

- [ ] **Step 2: MenuCard + MenuGrid**

`src/components/MenuCard.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
import type { MenuItem } from '../types'
import { formatKRW } from '../lib/money'

export default function MenuCard({ item }: { item: MenuItem }) {
  const nav = useNavigate()
  return (
    <button onClick={() => nav(`/item/${item.id}`)} className="text-left">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-2 left-2 text-lg">{item.emoji}</span>
      </div>
      <div className="mt-2 font-medium text-sm">{item.name}</div>
      <div className="text-sm text-neutral-500">{formatKRW(item.price)}</div>
    </button>
  )
}
```

`src/components/MenuGrid.tsx`:
```tsx
import type { MenuItem } from '../types'
import MenuCard from './MenuCard'

export default function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {items.map((it) => <MenuCard key={it.id} item={it} />)}
    </div>
  )
}
```

- [ ] **Step 3: Menu 화면**

`src/routes/Menu.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MENU, CATEGORIES } from '../data/menu'
import { useCartStore } from '../store/useCartStore'
import CategoryTabs from '../components/CategoryTabs'
import MenuGrid from '../components/MenuGrid'

export default function Menu() {
  const nav = useNavigate()
  const [cat, setCat] = useState(CATEGORIES[0].id)
  const orderType = useCartStore((s) => s.orderType)
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="flex items-center justify-between h-14 px-4 border-b border-neutral-100">
        <span className="font-bold">메이</span>
        <span className="text-sm text-neutral-400">{orderType === 'TAKE_OUT' ? '포장' : '매장'}</span>
      </header>
      <CategoryTabs active={cat} onChange={setCat} />
      <MenuGrid items={MENU.filter((m) => m.categoryId === cat)} />
      {count > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-kiosk p-4 bg-white border-t border-neutral-100">
          <button onClick={() => nav('/cart')} className="w-full h-14 rounded-2xl bg-brand text-white font-bold">
            장바구니 ({count})
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 검증 → 커밋**

Run: `npm run dev` → 카테고리 전환, 카드 그리드, 항목 클릭 시 `/item/:id`.
```bash
git add -A && git commit -m "feat: menu screen (/menu)"
```

---

## Task 7: 상세/옵션 화면 `/item/:id`

**Files:**
- Create: `src/components/OptionGroup.tsx`, `src/components/QtyStepper.tsx`
- Modify: `src/routes/ItemDetail.tsx`

- [ ] **Step 1: QtyStepper**

`src/components/QtyStepper.tsx`:
```tsx
export default function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={() => onChange(qty - 1)} className="w-9 h-9 rounded-full border border-neutral-200 text-xl">−</button>
      <span className="w-6 text-center font-bold">{qty}</span>
      <button onClick={() => onChange(qty + 1)} className="w-9 h-9 rounded-full border border-neutral-200 text-xl">+</button>
    </div>
  )
}
```

- [ ] **Step 2: OptionGroup (라디오)**

`src/components/OptionGroup.tsx`:
```tsx
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
```

- [ ] **Step 3: ItemDetail 화면 (옵션 기본값 = 각 그룹 첫 옵션)**

`src/routes/ItemDetail.tsx`:
```tsx
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
    nav('/cart')
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
```

- [ ] **Step 4: 검증 → 커밋**

Run: `npm run dev` → 옵션 선택 시 합계 갱신, 담기 → `/cart`에 반영.
```bash
git add -A && git commit -m "feat: item detail with options (/item/:id)"
```

---

## Task 8: 장바구니 화면 `/cart`

**Files:**
- Create: `src/components/CartLine.tsx`
- Modify: `src/routes/Cart.tsx`

- [ ] **Step 1: CartLine**

`src/components/CartLine.tsx`:
```tsx
import type { CartItem } from '../types'
import { formatKRW } from '../lib/money'
import { useCartStore } from '../store/useCartStore'
import { useNavigate } from 'react-router-dom'
import QtyStepper from './QtyStepper'

export default function CartLine({ item }: { item: CartItem }) {
  const nav = useNavigate()
  const { updateQty, removeItem } = useCartStore()
  return (
    <div className="flex justify-between gap-3 px-4 py-4 border-b border-neutral-100">
      <div className="flex-1">
        <div className="font-bold">{item.name}</div>
        {item.optionSummary && (
          <button onClick={() => nav(`/item/${item.itemId}`)} className="text-sm text-neutral-400 mt-0.5">
            {item.optionSummary} <span className="text-brand">변경 ›</span>
          </button>
        )}
        <div className="flex items-center gap-3 mt-2">
          <QtyStepper qty={item.quantity} onChange={(q) => updateQty(item.lineId, q)} />
          <button onClick={() => removeItem(item.lineId)} className="text-sm text-neutral-300">삭제</button>
        </div>
      </div>
      <div className="font-bold">{formatKRW(item.unitPrice * item.quantity)}</div>
    </div>
  )
}
```

- [ ] **Step 2: Cart 화면**

`src/routes/Cart.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import { formatKRW } from '../lib/money'
import Header from '../components/Header'
import CartLine from '../components/CartLine'
import StickyButton from '../components/StickyButton'

export default function Cart() {
  const nav = useNavigate()
  const { items, total } = useCartStore()

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="장바구니" />
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400">장바구니가 비었어요</div>
      ) : (
        <>
          <div className="flex-1">
            {items.map((it) => <CartLine key={it.lineId} item={it} />)}
            <div className="flex justify-between px-4 py-5 font-bold">
              <span>총 결제금액</span><span>{formatKRW(total())}</span>
            </div>
          </div>
          <StickyButton label="결제하기" amount={formatKRW(total())} onClick={() => nav('/checkout')} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 검증 → 커밋**

Run: `npm run dev` → 수량/삭제/변경, 결제하기 → `/checkout`.
```bash
git add -A && git commit -m "feat: cart screen (/cart)"
```

---

## Task 9: Supabase + 주문/결제 lib

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/orders.ts`, `.env.example`

- [ ] **Step 1: env 예시**

`.env.example`:
```
VITE_SUPABASE_URL=https://pmxeiivhksujxuvmryxu.supabase.co
VITE_SUPABASE_ANON_KEY=__라이브_번들/대시보드의_anon_키__
VITE_TOSS_CLIENT_KEY=__토스_테스트_클라이언트키(test_ck_...)__
```
> 실제 anon 키는 라이브 번들(`assets/index-*.js`의 `eyJ...` 첫 토큰) 또는 Supabase 대시보드 Settings→API에서, 토스 클라이언트키(test)는 토스 대시보드/번들에서 확보. `.env`로 저장(커밋 금지).

- [ ] **Step 2: supabase 클라이언트**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

- [ ] **Step 3: orders lib**

`src/lib/orders.ts`:
```ts
import { supabase } from './supabase'
import type { CartItem, OrderType } from '../types'

export interface NewOrder {
  orderId: string
  orderNumber: string
  orderType: OrderType
  items: CartItem[]
  totalAmount: number
}

export async function createPendingOrder(o: NewOrder): Promise<void> {
  const { error } = await supabase.from('orders').insert({
    order_id: o.orderId,
    order_number: o.orderNumber,
    order_type: o.orderType,
    items: o.items,
    total_amount: o.totalAmount,
    status: 'pending',
  })
  if (error) throw error
}

export async function confirmPayment(args: { paymentKey: string; orderId: string; amount: number }) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(args),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? '결제 승인 실패')
  return data as { ok: true; orderId: string; approvedAt: string | null }
}
```

- [ ] **Step 4: 빌드 확인 → 커밋**

Run: `npm run build`
Expected: 성공 (env 없으면 런타임에서만 영향)
```bash
git add -A && git commit -m "feat: supabase client + orders lib"
```

---

## Task 10: orders 테이블 마이그레이션 (Supabase)

**Files:**
- Create: `supabase/migrations/0001_orders.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/0001_orders.sql`:
```sql
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_id         text unique not null,
  order_number     text not null,
  order_type       text not null check (order_type in ('EAT_IN','TAKE_OUT')),
  items            jsonb not null,
  total_amount     integer not null,
  status           text not null default 'pending' check (status in ('pending','paid','canceled')),
  toss_payment_key text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "kiosk insert order" on public.orders
  for insert to anon with check (status = 'pending');
create policy "kiosk read order" on public.orders
  for select to anon using (true);
```

- [ ] **Step 2: 적용 (owner 토큰 필요 — 1시간 만료, 재발급 받아 사용)**

Management API로 적용 (토큰은 파일/환경변수로, 출력 금지):
```bash
REF=pmxeiivhksujxuvmryxu
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data-binary @<(jq -Rs '{query:.}' supabase/migrations/0001_orders.sql)
```
Expected: 에러 없는 응답(`[]` 또는 성공). 권한/네트워크 차단 시 사용자에게 토큰 재발급 요청.

- [ ] **Step 3: 적용 검증**

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"select column_name from information_schema.columns where table_name='"'"'orders'"'"' order by ordinal_position;"}'
```
Expected: `order_id, total_amount, status, toss_payment_key, paid_at` 등 컬럼 확인.

- [ ] **Step 4: 커밋**

```bash
git add -A && git commit -m "feat: orders table migration"
```

---

## Task 11: 결제 화면 `/checkout` (토스 위젯)

**Files:**
- Create: `src/lib/payments.ts`
- Modify: `src/routes/Checkout.tsx`

- [ ] **Step 1: payments lib (토스 위젯 v2)**

`src/lib/payments.ts`:
```ts
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY

export async function mountPaymentWidget(el: { methods: string; agreement: string }, amount: number) {
  const toss = await loadTossPayments(clientKey)
  const widgets = toss.widgets({ customerKey: 'ANONYMOUS' })
  await widgets.setAmount({ currency: 'KRW', value: amount })
  await Promise.all([
    widgets.renderPaymentMethods({ selector: `#${el.methods}`, variantKey: 'DEFAULT' }),
    widgets.renderAgreement({ selector: `#${el.agreement}`, variantKey: 'AGREEMENT' }),
  ])
  return widgets
}
```
> SDK 버전에 따라 메서드명이 다를 수 있으니 설치 후 `node_modules/@tosspayments/tosspayments-sdk` 타입 정의로 `requestPayment` 시그니처를 확인하고 맞춘다.

- [ ] **Step 2: Checkout 화면 — 주문 insert + 위젯 + 결제요청**

`src/routes/Checkout.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '../store/useCartStore'
import { formatKRW } from '../lib/money'
import { makeOrderId, makeOrderNumber } from '../lib/ids'
import { createPendingOrder } from '../lib/orders'
import { mountPaymentWidget } from '../lib/payments'
import Header from '../components/Header'

export default function Checkout() {
  const { items, total, orderType } = useCartStore()
  const amount = total()
  const widgetsRef = useRef<Awaited<ReturnType<typeof mountPaymentWidget>>>()
  const orderRef = useRef<{ orderId: string; orderNumber: string }>()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (amount <= 0) return
    const orderId = makeOrderId(); const orderNumber = makeOrderNumber()
    orderRef.current = { orderId, orderNumber }
    mountPaymentWidget({ methods: 'toss-methods', agreement: 'toss-agreement' }, amount)
      .then((w) => { widgetsRef.current = w; setReady(true) })
  }, [amount])

  const pay = async () => {
    const o = orderRef.current; const w = widgetsRef.current
    if (!o || !w) return
    await createPendingOrder({ orderId: o.orderId, orderNumber: o.orderNumber, orderType: orderType!, items, totalAmount: amount })
    sessionStorage.setItem('mm-order-number', o.orderNumber)
    await w.requestPayment({
      orderId: o.orderId,
      orderName: items[0] ? `${items[0].name} 외 ${items.length - 1}건` : '주문',
      successUrl: `${window.location.origin}/success`,
      failUrl: `${window.location.origin}/checkout`,
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="결제하기" />
      <div className="flex-1">
        <div className="px-4 py-4 border-b border-neutral-100">
          {items.map((it) => (
            <div key={it.lineId} className="flex justify-between py-1">
              <span>{it.name} × {it.quantity}<span className="block text-sm text-neutral-400">{it.optionSummary}</span></span>
              <span>{formatKRW(it.unitPrice * it.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 font-bold"><span>총 결제금액</span><span>{formatKRW(amount)}</span></div>
        </div>
        <div id="toss-methods" />
        <div id="toss-agreement" />
      </div>
      <div className="sticky bottom-0 p-4 bg-white border-t border-neutral-100">
        <button onClick={pay} disabled={!ready}
          className="w-full h-14 rounded-2xl bg-brand text-white font-bold disabled:opacity-40">
          {formatKRW(amount)} 결제하기
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 검증 → 커밋**

Run: `.env` 채우고 `npm run dev` → `/checkout`에서 토스 위젯(테스트) 렌더 + 결제수단 노출 확인. (실결제는 테스트키라 안전)
```bash
git add -A && git commit -m "feat: checkout with toss widget + pending order"
```

---

## Task 12: 완료 화면 `/success` (결제 승인)

**Files:**
- Modify: `src/routes/Success.tsx`

- [ ] **Step 1: 구현 — confirm-payment 호출**

`src/routes/Success.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPayment } from '../lib/orders'
import { useCartStore } from '../store/useCartStore'

export default function Success() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const clear = useCartStore((s) => s.clear)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState('')
  const orderNumber = sessionStorage.getItem('mm-order-number') ?? ''

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = Number(params.get('amount'))
    if (!paymentKey || !orderId || !amount) { setState('error'); setMsg('결제 정보가 없습니다.'); return }
    confirmPayment({ paymentKey, orderId, amount })
      .then(() => { setState('ok'); clear() })
      .catch((e) => { setState('error'); setMsg(String(e.message ?? e)) })
  }, [])

  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center">결제 확인 중…</div>
  if (state === 'error') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-4xl">⚠️</div><p>{msg}</p>
      <button onClick={() => nav('/cart')} className="h-12 px-6 rounded-xl bg-neutral-100">장바구니로</button>
    </div>
  )
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="text-xl font-bold">주문이 완료되었어요</h1>
      <p className="text-neutral-400">주문번호</p>
      <p className="text-3xl font-bold tracking-widest">{orderNumber}</p>
      <button onClick={() => nav('/')} className="mt-6 h-12 px-8 rounded-xl bg-brand text-white font-bold">처음으로</button>
    </div>
  )
}
```

- [ ] **Step 2: 전체 플로우 검증**

Run: `.env` 설정 후 `npm run dev` → `/` → 메뉴 → 담기 → 장바구니 → 결제(테스트) → `/success`에서 주문번호 표시 + 장바구니 비움. Supabase `orders`에 `status='paid'` 행 확인.

- [ ] **Step 3: 커밋**

```bash
git add -A && git commit -m "feat: success screen with payment confirm"
```

---

## Task 13: 라이브 픽셀 대조 + 마감

**Files:** (필요 시 컴포넌트 className 미세조정)

- [ ] **Step 1: 라이브 대조**

Run: 로컬(`localhost:5173`)과 라이브(`marketmay-kiosk.pages.dev`)를 같은 폭(480)으로 나란히 비교. 색/간격/폰트 어긋나는 부분 보정.
참고 캡처: `~/kiosk-01~05*.png`.

- [ ] **Step 2: 전체 테스트 + 빌드**

Run: `npm test && npm run build`
Expected: 모든 단위테스트 PASS, 빌드 성공.

- [ ] **Step 3: README + 커밋**

`README.md`에 실행/배포/env 안내 추가.
```bash
git add -A && git commit -m "docs: readme + pixel polish"
```

- [ ] **Step 4: 배포 (선택)**

Cloudflare Pages에 `wlsdn21/kiosk` 연결 또는 `dist/` 직접 업로드. env 3종을 Pages 환경변수로 등록. (사용자 확인 후 진행)

---

## Self-Review 메모

- 스펙 화면 6개(`/`,`/menu`,`/item/:id`,`/cart`,`/checkout`,`/success`) → Task 5~12로 전부 커버.
- `orders` 컬럼명(`order_id`,`total_amount`,`status`,`toss_payment_key`,`paid_at`)이 `confirm-payment` 함수 참조명과 일치(Task 10 ↔ Task 9 orders.ts insert 키와 일치).
- 단위 테스트: menu, money, ids, cart store (순수 로직). UI는 dev 실행 + 라이브 대조로 검증.
- 미확정: anon 키·토스 테스트키는 `.env`에서 주입(Task 9), `orderNumber` 표기는 4자리 영숫자로 구현(추후 라이브 확인 시 보정).
</content>
