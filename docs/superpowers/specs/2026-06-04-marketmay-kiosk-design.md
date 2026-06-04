# marketmay 키오스크 재제작 설계 (MVP)

- 작성일: 2026-06-04
- 대상 repo: `wlsdn21/kiosk` (현재 빈 repo, 로컬 `~/code/kiosk`)
- 기준: 라이브 키오스크(`https://marketmay-kiosk.pages.dev`) 화면/플로우 그대로 복제 + 결제 후 주문 저장 추가

## 배경

기존 키오스크의 편집 가능한 소스는 다른 컴퓨터에만 있고 접근 불가. 라이브 사이트와 백엔드(Supabase)는 살아있으므로, **프론트엔드(React)를 새로 만들어 기존 백엔드를 재사용**한다.

라이브 분석으로 확정된 사실:
- 프레임워크: **Vite + React 19 + react-router + TypeScript** (정적 빌드 → Cloudflare Pages)
- **메뉴는 프론트엔드 하드코딩** (Supabase 테이블 read 없음). 항목 형태:
  `{ id, categoryId, name, desc, price, emoji, image(Unsplash photoId), optionGroups[] }`
- 카테고리: `커피 / 라떼·티 / 에이드·스무디 / 디저트 / 시즌`
- 공유 옵션그룹: **사이즈**(레귤러 / 라지 +800, 필수), **온도**(HOT / ICE, 필수)
- 결제: **토스페이먼츠 결제위젯 v2**, 현재 **테스트 모드**("실제로 결제되지 않아요")
- 백엔드: Supabase 프로젝트 `pmxeiivhksujxuvmryxu`, Edge Function `confirm-payment` 1개뿐. **public 스키마에 테이블 0개** — 즉 라이브는 결제만 하고 주문을 저장하지 않는 미완성 MVP.

`confirm-payment` 계약 (소스 확인):
- 입력: `{ paymentKey, orderId, amount }` (anon JWT 인증)
- 동작: `orders` 테이블에 `order_id` 행이 **있으면** `total_amount` 대조 + 멱등(이미 paid면 skip) → 토스 승인 API(시크릿키, 서버) → 행이 있으면 `status='paid', toss_payment_key, paid_at` 갱신
- 출력: `{ ok: true, orderId, approvedAt }` 또는 `{ error }`
- 함수는 **이미 `orders` 테이블 연동을 전제로 작성됨** → 우리가 테이블만 만들면 그대로 동작.

## 목표 (이번 범위)

라이브 6개 화면을 그대로 복제하고, **결제 전 주문을 Supabase `orders`에 저장**해 결제 결과가 실제로 남도록 한다. (주방/KDS 실시간 전송은 이번 범위 제외.)

## 비목표 (YAGNI)

- KDS(주방 디스플레이) 실시간 연동 — 제외
- 메뉴를 DB화/관리자 화면 — 제외 (메뉴는 하드코딩 유지, 라이브와 동일)
- 회원/로그인, 적립, 쿠폰 — 제외
- 다국어 — 제외 (한국어 고정)

## 화면 / 라우트 (react-router)

| 라우트 | 화면 | 핵심 요소 |
|---|---|---|
| `/` | 주문방식 선택 | 메이 로고(☕) + "매장에서 먹기 / 포장하기" 2카드. 선택 시 주문타입 저장 후 `/menu` |
| `/menu` | 메뉴 | 헤더(메이 · 매장/포장) + 카테고리 탭 + 2열 그리드(이미지·이모지·이름·가격) |
| `/item/:id` | 상세/옵션 | 히어로 이미지 + 이름·설명·가격 + 사이즈·온도(필수 라디오) + 수량 스테퍼 + sticky "담기 {합계}" |
| `/cart` | 장바구니 | 라인아이템(이름·옵션요약·변경›·수량·삭제) + 총 결제금액 + sticky "결제하기 {합계}" |
| `/checkout` | 결제 | 주문요약 + 토스 결제위젯(테스트) + 약관동의 + "{합계} 결제하기" |
| `/success` | 완료 | 주문번호 표시 + 처음으로 돌아가기 |

플로우: `/` → `/menu` → (`/item/:id` → 담기) → `/cart` → `/checkout` → 토스 결제 → 리다이렉트 `/success`.

## 기술 스택

- Vite + React 19 + TypeScript + react-router-dom v7
- Tailwind CSS (+ 필요한 shadcn 스타일 프리미티브) — 라이트 테마 고정
- 상태: **zustand** (장바구니 store; localStorage persist로 결제 리다이렉트 후 복원)
- 결제: `@tosspayments/tosspayments-sdk` (결제위젯 v2)
- 백엔드: `@supabase/supabase-js` (orders insert + confirm-payment 호출)
- 메인 컬러: 초록 계열(라이브 버튼색 ≈ `#1a9e5f`), 카드/회색 토큰은 라이브 캡처 기준

## 컴포넌트 구조

```
src/
  main.tsx, App.tsx            # 라우터 정의
  routes/
    OrderType.tsx              # /
    Menu.tsx                   # /menu
    ItemDetail.tsx             # /item/:id
    Cart.tsx                   # /cart
    Checkout.tsx               # /checkout
    Success.tsx                # /success
  components/
    Header.tsx                 # 뒤로가기 + 타이틀 (+ 주문타입 배지)
    CategoryTabs.tsx
    MenuGrid.tsx / MenuCard.tsx
    OptionGroup.tsx            # 라디오 그룹 (필수)
    QtyStepper.tsx
    CartLine.tsx
    StickyButton.tsx           # 하단 고정 CTA
  store/
    useCartStore.ts            # 주문타입, items[], 합계, add/remove/updateQty/clear (persist)
  lib/
    supabase.ts                # 클라이언트 (URL + anon key, env)
    payments.ts                # 토스 위젯 init + requestPayment
    orders.ts                  # createOrder(insert) + confirmPayment(호출)
    money.ts, ids.ts           # 가격 포맷, orderId/orderNumber 생성
  data/
    menu.ts                    # 하드코딩 메뉴 (라이브 번들에서 전량 추출)
    options.ts                 # 사이즈/온도 옵션그룹
  types.ts                     # MenuItem, CartItem, OrderType, Order
```

각 단위 책임: `store`는 장바구니 상태만, `lib/orders`는 DB·결제 호출만, `routes`는 화면 조립만. 화면은 store/lib 인터페이스로만 통신.

## 데이터 모델

```ts
type OrderType = 'EAT_IN' | 'TAKE_OUT';

interface MenuItem {
  id: string; categoryId: string; name: string; desc: string;
  price: number; emoji: string; image: string;     // 완성 Unsplash URL
  optionGroups: OptionGroup[];                       // 사이즈, 온도
}
interface OptionGroup { id: string; label: string; required: boolean; options: Option[]; }
interface Option { id: string; label: string; priceDelta: number; }  // 라지 +800 등

interface CartItem {
  lineId: string; itemId: string; name: string;
  selected: Record<string,string>;  // groupId -> optionId
  optionSummary: string;            // "레귤러 · HOT"
  unitPrice: number; quantity: number;
}
```

## Supabase `orders` 테이블 (신규 — confirm-payment 계약에 맞춤)

```sql
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_id        text unique not null,        -- 토스 orderId (클라 생성)
  order_number    text not null,               -- 화면 표시용 번호
  order_type      text not null check (order_type in ('EAT_IN','TAKE_OUT')),
  items           jsonb not null,              -- CartItem[] 스냅샷
  total_amount    integer not null,
  status          text not null default 'pending'
                   check (status in ('pending','paid','canceled')),
  toss_payment_key text,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.orders enable row level security;
-- 키오스크(anon)는 주문 생성(insert)과 자기 주문 조회(select)만 가능. update/delete는 service_role(함수)만.
create policy "kiosk insert order" on public.orders for insert to anon with check (status = 'pending');
create policy "kiosk read order"  on public.orders for select to anon using (true);
```

> 컬럼명(`order_id`, `total_amount`, `status`, `toss_payment_key`, `paid_at`)은 `confirm-payment` 함수가 참조하는 이름과 정확히 일치시킴.

## 결제 흐름 (상세)

1. `/checkout` 진입 → `orderId = order_{ts}_{rand}`, `orderNumber` 생성
2. `orders`에 `status='pending'`으로 insert (total_amount = 장바구니 합계)
3. 토스 위젯 렌더 → `requestPayment({ orderId, orderName, amount, successUrl:/success, failUrl:/checkout })`
4. 토스 결제 완료 → `successUrl?paymentKey&orderId&amount` 로 리다이렉트
5. `/success`에서 `confirm-payment` 호출 `{ paymentKey, orderId, amount }`
6. `ok` 응답 → 주문번호 표시. 실패 → 에러 표시 + 재시도 안내

## 보안 메모

- anon은 insert 시 `status='pending'` 강제(정책). 금액 위변조는 `confirm-payment`가 저장된 `total_amount`와 실결제 `amount`를 대조해 차단(함수 기존 로직). 단, 클라이언트가 total을 계산해 보내므로 가격 신뢰는 클라이언트에 의존 — MVP 한계로 수용(라이브와 동일 수준). 추후 서버 가격검증은 별도 과제.
- anon 키·토스 클라이언트키(테스트)는 공개되어도 되는 키. 토스 시크릿키는 edge function 환경변수에만 존재(노출 없음).
- env(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TOSS_CLIENT_KEY`)로 분리, `.env`는 gitignore.

## 배포

- Cloudflare Pages (라이브와 동일). 빌드 `npm run build` → `dist/`.
- repo `wlsdn21/kiosk`에 push → Pages 연결(또는 직접 업로드). env는 Pages 설정에 등록.

## 구현 전 준비물 (구현 단계에서 처리)

- Supabase owner 토큰(1시간 만료) — `orders` 테이블 마이그레이션 적용용. 만료 시 재발급 필요.
- 라이브 번들에서 전체 메뉴 항목 + 옵션그룹 전량 추출(기계적).
- 토스 클라이언트키(테스트) — 라이브 번들/토스 대시보드에서 확인.

## 미해결/확인 필요

- `orderNumber` 표기 규칙(라이브 success 화면 미확인 — 테스트결제 미완료). 일 단위 시퀀스 또는 짧은 랜덤으로 구현하고 추후 라이브 확인 시 맞춤.
- 라이브의 정확한 컬러/폰트 토큰은 캡처 기준 근사치 → 구현 후 라이브와 픽셀 비교로 보정.
