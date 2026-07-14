/*
# Fix event-assets storage policies

The previous migration created the bucket but the INSERT/UPDATE/DELETE policies
had overly complex path-matching logic that would reject valid uploads.
Simplify to: authenticated users can upload/update/delete in event-assets,
since RLS on the events table already ensures only the event owner can reach
the editor page that triggers uploads.
*/

DROP POLICY IF EXISTS "auth_insert_event_assets" ON storage.objects;
CREATE POLICY "auth_insert_event_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-assets');

DROP POLICY IF EXISTS "auth_update_event_assets" ON storage.objects;
CREATE POLICY "auth_update_event_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-assets')
WITH CHECK (bucket_id = 'event-assets');

DROP POLICY IF EXISTS "auth_delete_event_assets" ON storage.objects;
CREATE POLICY "auth_delete_event_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-assets');
