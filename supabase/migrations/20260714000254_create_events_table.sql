/*
# Create events table

## Purpose
Stores event metadata for the Seatly application. Each event belongs to
one organiser (authenticated user) and contains the information guests
see on the Find Your Seat page.

## New Tables
- `events`
  - `id` (uuid, primary key, auto-generated)
  - `user_id` (uuid, not null, defaults to auth.uid() — links to auth.users)
  - `name` (text, not null — the event name, e.g. "Sarah & James Wedding")
  - `slug` (text, not null, unique — URL-safe identifier for the guest-facing Find Your Seat page)
  - `date` (date, nullable — event date)
  - `time` (time, nullable — event start time)
  - `venue` (text, nullable — venue name/address)
  - `logo_url` (text, nullable — URL to the event logo image)
  - `cover_url` (text, nullable — URL to the event cover image)
  - `accent_color` (text, nullable — hex color string for custom accent)
  - `invitation_enabled` (boolean, default false — whether the digital invitation is visible to guests)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Security
- RLS enabled on `events`.
- Four policies (select/insert/update/delete), each scoped to `authenticated`
  with ownership check `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so inserts that omit it succeed.

## Important Notes
1. The `slug` column has a unique constraint to prevent duplicate guest-facing URLs.
2. The `user_id` column has a foreign key to `auth.users` with `ON DELETE CASCADE`
   so that deleting a user removes their events.
3. An index on `user_id` speeds up per-organiser queries.
4. An index on `slug` speeds up the guest-facing Find Your Seat lookup.
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  date date,
  time time,
  venue text,
  logo_url text,
  cover_url text,
  accent_color text,
  invitation_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON events;
CREATE POLICY "select_own_events" ON events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON events;
CREATE POLICY "insert_own_events" ON events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_events" ON events;
CREATE POLICY "update_own_events" ON events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON events;
CREATE POLICY "delete_own_events" ON events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
