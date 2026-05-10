-- Records the affinity nudge applied when this wear was logged.
-- Lets the user undo a wear and have the score nudge reversed exactly.
-- Nullable so existing rows (logged before this column existed) remain valid;
-- callers should treat null as "no nudge to reverse".

alter table public.wear_log
  add column affinity_delta real;

comment on column public.wear_log.affinity_delta is
  'The pair-affinity delta applied to each item pair when this wear was logged. Used to reverse the nudge on undo.';
