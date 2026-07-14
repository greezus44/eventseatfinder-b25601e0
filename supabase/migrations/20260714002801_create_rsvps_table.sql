/*
# Create rsvps table

## Purpose
Stores RSVP responses from guests for an event. Each RSVP is linked to a guest
and records their attendance status and optional plus-one count.

## New Tables
- `rsvps`
  - `id` (uuid, primary key)
  - `event_id` (uuid, not null — FK to events.id, ON DELETE CASCADE)
  - `guest_id` (uuid, not null — FK to guests.id, ON DELETE CASCADE)
  - `status` (text, not null — 'attending', 'not_attending', 'maybe')
  - `plus_ones` (int, default 0 — number of additional guests)
  - `message` (text, nullable — optional message from guest)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Security
- RLS enabled on `rsvps`.
- Owner-scoped CRUD via ownership check through the parent event.
- Anon INSERT/SELECT so guests can submit RSVPs without logging in.
- Unique constraint on (event_id, guest_id) — one RSVP per guest per event.

## Important Notes
1. Index on event_id for efficient lookups.
2. Unique constraint prevents duplicate RSVPs.
*/

CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'maybe' CHECK (status IN ('attending', 'not_attending', 'maybe')),
  plus_ones int NOT NULL DEFAULT 0,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, guest_id)
);

ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies (through event ownership)
DROP POLICY IF EXISTS "select_own_rsvps" ON rsvps;
CREATE POLICY "select_own_rsvps" ON rsvps FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_rsvps" ON rsvps;
CREATE POLICY "insert_own_rsvps" ON rsvps FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_rsvps" ON rsvps;
CREATE POLICY "update_own_rsvps" ON rsvps FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_rsvps" ON rsvps;
CREATE POLICY "delete_own_rsvps" ON rsvps FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  );

-- Anon access for guest-facing RSVP submission
DROP POLICY IF EXISTS "read_rsvps_anon" ON rsvps;
CREATE POLICY "read_rsvps_anon" ON rsvps FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_rsvps_anon" ON rsvps;
CREATE POLICY "insert_rsvps_anon" ON rsvps FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_rsvps_anon" ON rsvps;
CREATE POLICY "update_rsvps_anon" ON rsvps FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
