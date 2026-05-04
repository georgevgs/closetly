-- Closetly initial schema
-- Tables: profiles, items, outfits, outfit_items, favorites, item_pair_affinity,
--         wear_log, trips
-- All tables protected by RLS scoped to auth.uid()

create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------

create type item_category as enum (
  'top','bottom','dress','outerwear','shoes','bag','hat','accessory'
);

create type item_pattern as enum (
  'solid','striped','plaid','floral','graphic','animal','print'
);

create type style_tag as enum (
  'minimal','classic','streetwear','elegant','bohemian','sporty','preppy','edgy'
);

create type season_tag as enum ('spring','summer','autumn','winter');

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_styles style_tag[] not null default '{}',
  home_timezone text,
  created_at timestamptz not null default now()
);

-- Items (closet) ------------------------------------------------------------

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category item_category not null,
  name text,
  photo_path text not null,
  thumb_path text,
  colors jsonb not null default '[]'::jsonb,
  formality smallint not null default 3 check (formality between 1 and 5),
  warmth smallint not null default 2 check (warmth between 0 and 4),
  pattern item_pattern not null default 'solid',
  seasons season_tag[] not null default '{}',
  styles style_tag[] not null default '{}',
  brand text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_user_idx on public.items (user_id) where archived = false;
create index items_user_category_idx on public.items (user_id, category) where archived = false;

-- Outfits -------------------------------------------------------------------

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  rating smallint check (rating between 1 and 5),
  worn_count integer not null default 0,
  last_worn_at timestamptz,
  created_at timestamptz not null default now()
);

create index outfits_user_idx on public.outfits (user_id);

create table public.outfit_items (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  primary key (outfit_id, item_id)
);

create index outfit_items_item_idx on public.outfit_items (item_id);

-- Favorites & affinity ------------------------------------------------------

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, outfit_id)
);

-- Pairwise affinity learned from rating/wearing combinations together
create table public.item_pair_affinity (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_a uuid not null references public.items(id) on delete cascade,
  item_b uuid not null references public.items(id) on delete cascade,
  affinity real not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_a, item_b),
  check (item_a < item_b)
);

create index item_pair_affinity_user_idx on public.item_pair_affinity (user_id);

-- Wear log ------------------------------------------------------------------

create table public.wear_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid references public.outfits(id) on delete set null,
  worn_on date not null default current_date,
  weather jsonb,
  created_at timestamptz not null default now()
);

create index wear_log_user_date_idx on public.wear_log (user_id, worn_on desc);

-- Trips ---------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  destination text,
  start_date date not null,
  end_date date not null,
  expected_temp_min smallint,
  expected_temp_max smallint,
  notes text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.trip_items (
  trip_id uuid not null references public.trips(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  packed boolean not null default false,
  primary key (trip_id, item_id)
);

-- updated_at trigger --------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.tg_set_updated_at();

-- New user → profile trigger ------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS -----------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.favorites enable row level security;
alter table public.item_pair_affinity enable row level security;
alter table public.wear_log enable row level security;
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;

-- profiles: user can read/update own row
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- items
create policy items_all_own on public.items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- outfits
create policy outfits_all_own on public.outfits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- outfit_items: scope through outfits
create policy outfit_items_select on public.outfit_items
  for select using (
    exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid())
  );
create policy outfit_items_modify on public.outfit_items
  for all using (
    exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid())
  );

-- favorites
create policy favorites_all_own on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- item_pair_affinity
create policy item_pair_affinity_all_own on public.item_pair_affinity
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- wear_log
create policy wear_log_all_own on public.wear_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- trips
create policy trips_all_own on public.trips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy trip_items_select on public.trip_items
  for select using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );
create policy trip_items_modify on public.trip_items
  for all using (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())
  );
