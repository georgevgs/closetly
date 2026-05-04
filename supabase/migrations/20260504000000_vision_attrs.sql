-- Vision attributes from on-upload Claude vision pass.
-- Stores detail-level fields the algorithm uses (silhouette, material,
-- texture, hardware, undertone, statement_level, sub_category) without
-- forcing them through the user-facing form.
-- The visible columns (category, formality, warmth, pattern, seasons,
-- styles, colors) keep their own typed columns and are pre-filled from
-- this analysis at write time.

alter table public.items
  add column vision_attrs jsonb not null default '{}'::jsonb;

comment on column public.items.vision_attrs is
  'Auto-detected attributes from on-upload vision pass. Schema is non-strict; consumers should treat fields as optional.';
