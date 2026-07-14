/*
# Remove broad SELECT policy on event-assets storage bucket

## Problem
The `event-assets` bucket is public, so object URLs work without any SELECT policy.
However, `auth_select_event_assets` allows any authenticated user to list ALL files
in the bucket via `storage.objects` SELECT, potentially exposing other users' assets.

## Fix
1. Drop the `auth_select_event_assets` SELECT policy.
2. The remaining INSERT/UPDATE/DELETE policies stay unchanged — authenticated users
   can still upload, update, and delete their own files.
3. Public URL access is unaffected because the bucket is public.

## Why this is safe
- The bucket is `public: true`, so `getPublicUrl()` + direct URL access works without RLS.
- Uploads use unique filenames (timestamp + random), so `upsert: true` is not needed.
- Without the SELECT policy, clients cannot enumerate files in the bucket.
*/

DROP POLICY IF EXISTS "auth_select_event_assets" ON storage.objects;
