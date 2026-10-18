-- Off-season pieces get packed away (shorts in October, the parka in May).
-- They still belong to the wardrobe, so `archived` is the wrong tool, but
-- they shouldn't be offered as today's outfit either. A timestamp instead of
-- a boolean lets the app show "stored since…" and reason about how long a
-- piece has been out of rotation when it comes back. Null = in the closet.

alter table public.items
  add column stored_at timestamptz;

comment on column public.items.stored_at is
  'When set, the item is packed away for the off-season: hidden from the closet grid and skipped by outfit suggestions. Null means it is in the active closet.';

-- A season swap moves pieces in both directions at once. Doing it in one
-- statement keeps the closet from ending up half-swapped if the connection
-- drops between "pack away" and "bring out".
create or replace function public.apply_season_swap(
  p_store_ids uuid[],
  p_return_ids uuid[]
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.items
  set stored_at = case
    when id = any(p_store_ids) then now()
    else null
  end
  where id = any(p_store_ids) or id = any(p_return_ids);
$$;
