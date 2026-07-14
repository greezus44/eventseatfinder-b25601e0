/*
# Add anon read policy for events (guest-facing)

## Purpose
Guests accessing the Find Your Seat page (/e/:slug) must be able to read
event data by slug WITHOUT authenticating. This adds a SELECT policy
for the `anon` role so the anon-key Supabase client can fetch event details.

## Security Changes
- New SELECT policy "read_events_by_slug_anon" on `events` for `anon, authenticated`.
  This is intentionally public for guest access — the Find Your Seat page
  is designed to work without login.
- Existing owner-scoped policies remain unchanged.

## Important Notes
1. This only allows SELECT (read). Writes are still restricted to the owner.
2. Guests can read all event fields, which is expected — they need the event
   name, date, venue, slug, and invitation_enabled to render the Find Your Seat page.
*/

DROP POLICY IF EXISTS "read_events_by_slug_anon" ON events;
CREATE POLICY "read_events_by_slug_anon" ON events FOR SELECT
  TO anon, authenticated USING (true);
