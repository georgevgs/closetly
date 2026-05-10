-- Adds the columns and enum needed to surface cost-per-wear, wash tracking,
-- and occasion-aware suggestions. Existing rows backfill to safe defaults
-- (no price, no currency, never washed, no occasions) so the migration is
-- non-destructive.

create type occasion_tag as enum (
  'work',
  'casual',
  'formal',
  'sport',
  'date',
  'travel',
  'party'
);

alter table public.items
  add column price numeric(10, 2) check (price is null or price >= 0),
  add column currency text check (currency is null or length(currency) = 3),
  add column purchased_on date,
  add column times_washed integer not null default 0 check (times_washed >= 0),
  add column occasions occasion_tag[] not null default '{}';

comment on column public.items.price is 'Item price in the matching currency.';
comment on column public.items.currency is 'ISO 4217 three-letter code (USD/EUR/…).';
comment on column public.items.times_washed is 'Total wash cycles. Bumped via increment_times_washed RPC for atomicity.';
comment on column public.items.occasions is 'Tagged contexts the piece is appropriate for. Empty = unspecified, treated as neutral by the suggestion engine.';

-- Same atomic-RPC pattern as outfit worn_count: a read-modify-write from the
-- client would lose updates if the user double-tapped the wash button.
create or replace function public.increment_times_washed(
  p_item_id uuid
)
returns integer
language sql
security invoker
set search_path = public
as $$
  update public.items
  set times_washed = times_washed + 1
  where id = p_item_id
  returning times_washed;
$$;
