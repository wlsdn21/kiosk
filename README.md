# 메이(marketmay) 키오스크

카페 "메이" 고객 주문 키오스크. 라이브(`marketmay-kiosk.pages.dev`)를 Vite + React로 재구현하고, 기존 Supabase 백엔드(결제 승인 함수)를 재사용하며 주문을 `orders` 테이블에 저장한다.

## 스택

- Vite + React 19 + TypeScript + react-router-dom v7
- Tailwind CSS, zustand(장바구니, localStorage persist)
- 토스페이먼츠 결제위젯 v2 (`@tosspayments/tosspayments-sdk`)
- Supabase (`@supabase/supabase-js`) — `orders` 테이블 + Edge Function `confirm-payment`

## 화면 흐름

`/` 주문방식(매장/포장) → `/menu` 메뉴 → `/item/:id` 옵션·수량 → `/cart` 장바구니 → `/checkout` 토스 결제 → `/success` 완료(주문번호)

## 개발

```bash
npm install
cp .env.example .env   # 값 채우기 (아래 참고)
npm run dev            # http://localhost:5173
npm run build          # 정적 빌드 → dist/
npm test               # 단위 테스트 (money, ids, menu, cart)
```

## 환경변수 (`.env`)

| 변수 | 설명 |
|---|---|
| `VITE_SUPABASE_URL` | `https://pmxeiivhksujxuvmryxu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon 키 (공개 키, 클라이언트 노출 OK) |
| `VITE_TOSS_CLIENT_KEY` | 토스 결제위젯 클라이언트 키. 현재 테스트키 사용 (실결제 X). 운영 전환 시 라이브 키로 교체 |

## 데이터

- **메뉴**: `src/data/menu-data.json` (27개) — 프론트 하드코딩. 가격/이미지/옵션 변경은 이 파일에서.
- **주문**: 결제 직전 `orders`에 `pending` insert → 토스 결제 → `confirm-payment` 함수가 토스 승인 + `status='paid'` 갱신.
- **스키마**: `supabase/migrations/0001_orders.sql`.

## 배포

Cloudflare Pages. `npm run build` 결과 `dist/`를 배포하고, 위 env 3종을 Pages 환경변수로 등록.

## 문서

- 설계: `docs/superpowers/specs/2026-06-04-marketmay-kiosk-design.md`
- 구현 계획: `docs/superpowers/plans/2026-06-04-marketmay-kiosk.md`

## 한계 (MVP)

- 결제 금액을 클라이언트가 계산해 전달 → `confirm-payment`가 저장 금액과 실결제 금액을 대조하지만, 서버 측 가격 재계산은 향후 과제.
- 주방(KDS) 실시간 전송 미연동 (주문은 DB에 저장됨).
- 토스 **테스트키** 사용 중 — 운영 시 라이브 키 전환 필요.
</content>
