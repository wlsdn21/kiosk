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

drop policy if exists "kiosk read order" on public.orders;
create policy "kiosk read order" on public.orders
  for select to anon using (true);
