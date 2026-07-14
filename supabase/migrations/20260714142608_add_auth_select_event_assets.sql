/*
# Add authenticated-only SELECT policy for event-assets bucket

1. Security
- Add a SELECT policy on `storage.objects` scoped to `authenticated` only
  for the `event-assets` bucket.
- The previous security fix removed the broad `public_read_event_assets`
  policy (which allowed anon to list all files). That was correct for
  closing the public listing vulnerability.
- However, the frontend upload code uses `upsert: true`, which requires
  a SELECT on `storage.objects` to check if a file already exists before
  deciding whether to INSERT or UPDATE. Without any SELECT policy, the
  upsert check fails and the upload silently errors.
- This new policy allows only authenticated users to SELECT (list/check)
  objects in the `event-assets` bucket. Anonymous users cannot list files
  (preserving the security fix) but can still access individual files via
  their public URLs (because the bucket is public).
2. Important Notes
- The bucket remains public, so public URLs work without any policy.
- Anonymous users can access individual files by URL but cannot enumerate
  the bucket contents.
- Authenticated users can list/check objects (needed for upsert uploads).
*/

DROP POLICY IF EXISTS "auth_select_event_assets" ON storage.objects;
CREATE POLICY "auth_select_event_assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-assets');
