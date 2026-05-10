-- Persist the seasons the user planned the trip for. Without this, reopening
-- a saved trip can't replay the same season filter the original capsule was
-- built against. Default empty so existing rows remain valid; the UI defaults
-- to ["spring","autumn"] for new trips.

alter table public.trips
  add column seasons season_tag[] not null default '{}';

comment on column public.trips.seasons is
  'Seasons selected when planning this trip. Used by the capsule generator to filter eligible items.';
