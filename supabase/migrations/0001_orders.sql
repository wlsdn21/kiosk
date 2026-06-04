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

drop policy if exists "kiosk insert order" on public.orders;
create policy "kiosk insert order" on public.orders
  for insert to anon with check (status = 'pending');

-- 키오스크(anon)는 결제 전 주문을 insert만 한다. 주문 조회는 클라이언트에서 하지 않으며
-- (Success 화면은 sessionStorage의 주문번호만 사용), 상태 갱신은 service_role(confirm-payment)이 한다.
-- anon select를 열면 anon 키만으로 전체 주문이 노출되므로 select 정책은 두지 않는다.
drop policy if exists "kiosk read order" on public.orders;
