-- KDS 동기화용: 한 번 주방에 보낸 주문 표시(중복 주입 방지)
alter table public.orders add column if not exists kds_synced_at timestamptz;
