-- Items currently in the laundry are still in the wardrobe but shouldn't be
-- offered by the suggestion engine. A simple boolean is enough: the user
-- toggles it off when the load is done. Backfills false so existing rows are
-- treated as available.

alter table public.items
  add column in_wash boolean not null default false;

comment on column public.items.in_wash is
  'When true, the item is currently being laundered and is skipped by anchor / combinator selection. Toggled manually by the user.';

-- The home-screen filters items by user_id and archived = false. Keep the
-- partial index narrow: most items are not in_wash, so a plain boolean column
-- with no extra index is fine here — the existing user_id index already
-- selects the right rows for in-memory filtering.
