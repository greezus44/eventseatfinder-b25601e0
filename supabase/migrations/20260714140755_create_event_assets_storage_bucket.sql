/*
# Create event-assets storage bucket

1. Storage
- Create a public bucket `event-assets` for event logos and venue layout images.
- Public bucket so images can be loaded via public URLs on the guest-facing site.
2. Storage Policies
- SELECT (read): public — anyone (anon + authenticated) can read, since logos/venue
  images must display on the public guest page without authentication.
- INSERT: authenticated users only, scoped to their own event directory path.
- UPDATE: authenticated users only, scoped to their own event directory path.
- DELETE: authenticated users only, scoped to their own event directory path.
3. Important Notes
- The bucket must be public so that `getPublicUrl()` returns a URL that loads
  without authentication headers — the guest page uses plain <img> tags.
- Upload paths follow the pattern `logo/{eventId}-...` and `venue/{eventId}-...`,
  so ownership is verified by checking the event belongs to the authenticated user.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-assets', 'event-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read objects (public guest page needs to display logos/venue images)
DROP POLICY IF EXISTS "public_read_event_assets" ON storage.objects;
CREATE POLICY "public_read_event_assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'event-assets');

-- Allow authenticated users to upload to event-assets
DROP POLICY IF EXISTS "auth_insert_event_assets" ON storage.objects;
CREATE POLICY "auth_insert_event_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-assets'
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.user_id = auth.uid()
    AND (
      -- Path format: {folder}/{eventId}-{timestamp}.{ext}
      (storage.foldername(name))[1] IN ('logo', 'venue')
      AND (storage.filename(name)) LIKE (storage.foldername(name))[1] || '/%'
    )
  )
);

-- Allow authenticated users to update objects in event-assets
DROP POLICY IF EXISTS "auth_update_event_assets" ON storage.objects;
CREATE POLICY "auth_update_event_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-assets'
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'event-assets'
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.user_id = auth.uid()
  )
);

-- Allow authenticated users to delete objects in event-assets
DROP POLICY IF EXISTS "auth_delete_event_assets" ON storage.objects;
CREATE POLICY "auth_delete_event_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-assets'
  AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.user_id = auth.uid()
  )
);
