/*
# Remove broad SELECT policy from public event-assets bucket

1. Security
- Drop the `public_read_event_assets` SELECT policy on `storage.objects`.
- The `event-assets` bucket is public, so objects are accessible via their
  public URLs without any SELECT policy. The SELECT policy only enabled the
  `storage.list()` API, which allowed any client to enumerate all files in
  the bucket — exposing more data than intended.
- INSERT/UPDATE/DELETE policies for authenticated users remain unchanged.
*/

DROP POLICY IF EXISTS "public_read_event_assets" ON storage.objects;
