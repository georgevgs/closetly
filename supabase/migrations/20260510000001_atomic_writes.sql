-- Atomic helpers for writes that were previously read-modify-write from the
-- client. Two concurrent wears (or a save + a wear) used to lose one of the
-- updates because each call read worn_count / affinity, computed locally, then
-- wrote back. These RPCs do the read-modify-write inside the database in one
-- statement, and the affinity helper folds N pair upserts into one call.
--
-- All functions run as security invoker so RLS policies on the underlying
-- tables continue to gate access by auth.uid().

create or replace function public.bump_pair_affinity(
  p_user_id uuid,
  p_pairs jsonb,
  p_delta real,
  p_min real,
  p_max real
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_delta = 0 then return; end if;
  if p_pairs is null or jsonb_array_length(p_pairs) = 0 then return; end if;

  insert into public.item_pair_affinity (user_id, item_a, item_b, affinity)
  select
    p_user_id,
    (pair->>'item_a')::uuid,
    (pair->>'item_b')::uuid,
    greatest(p_min, least(p_max, p_delta))
  from jsonb_array_elements(p_pairs) as pair
  on conflict (user_id, item_a, item_b)
  do update set
    affinity = greatest(
      p_min,
      least(p_max, public.item_pair_affinity.affinity + excluded.affinity)
    ),
    updated_at = now();
end;
$$;

create or replace function public.increment_outfit_worn_count(
  p_outfit_id uuid,
  p_set_last_worn boolean default true
)
returns integer
language sql
security invoker
set search_path = public
as $$
  update public.outfits
  set
    worn_count = worn_count + 1,
    last_worn_at = case when p_set_last_worn then now() else last_worn_at end
  where id = p_outfit_id
  returning worn_count;
$$;

create or replace function public.decrement_outfit_worn_count(
  p_outfit_id uuid
)
returns integer
language sql
security invoker
set search_path = public
as $$
  update public.outfits
  set worn_count = greatest(0, worn_count - 1)
  where id = p_outfit_id
  returning worn_count;
$$;
