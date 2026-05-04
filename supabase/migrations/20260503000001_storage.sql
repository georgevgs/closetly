-- Storage buckets for clothing photos
-- Bucket: closet-photos (private, user-scoped under <user_id>/<item_id>/<file>)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'closet-photos',
  'closet-photos',
  false,
  10 * 1024 * 1024,
  array['image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;

-- RLS: only owner can read/write objects under their own user_id prefix.

create policy "closet read own"
  on storage.objects for select
  using (
    bucket_id = 'closet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "closet insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'closet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "closet update own"
  on storage.objects for update
  using (
    bucket_id = 'closet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "closet delete own"
  on storage.objects for delete
  using (
    bucket_id = 'closet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
