-- Allow service role to read from private bucket epistle-assets (avatar previews, signed URLs).
-- Run this in Supabase SQL Editor if your backend (using SUPABASE_SERVICE_ROLE_KEY) gets "Object not found"
-- when creating signed URLs for epistle-assets/avatars/*.
--
-- Ref: https://supabase.com/docs/guides/storage/security/access-control

create policy "Service role can read epistle-assets"
on storage.objects
for select
to service_role
using ( bucket_id = 'epistle-assets' );
