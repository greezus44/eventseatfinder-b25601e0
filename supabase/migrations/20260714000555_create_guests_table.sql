/*
# Create guests table

## Purpose
Stores guest records for each event. Each guest has a name and an optional
table assignment. Guests search their name on the Find Your Seat page to
see which table they are assigned to.

## New Tables
- `guests`
  - `id` (uuid, primary key)
  - `event_id` (uuid, not null — FK to events.id, ON DELETE CASCADE)
  - `name` (text, not null — guest display name)
  - `table_id` (uuid, nullable — FK to tables.id, ON DELETE SET NULL)
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `guests`.
- Owner-scoped CRUD via ownership check through the parent event.
- Anon SELECT so guests can search their name without logging in.

## Important Notes
1. Index on (event_id, name) enables fast live search by name.
2. The table_id FK uses ON DELETE SET NULL so removing a table doesn't delete guests.
3. A trigram-enabled ILIKE search pattern is used in the frontend for fuzzy matching.
*/

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  table_id uuid REFERENCES tables(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies (through event ownership)
DROP POLICY IF EXISTS "select_own_guests" ON guests;
CREATE POLICY "select_own_guests" ON guests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_guests" ON guests;
CREATE POLICY "insert_own_guests" ON guests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_guests" ON guests;
CREATE POLICY "update_own_guests" ON guests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_guests" ON guests;
CREATE POLICY "delete_own_guests" ON guests FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = guests.event_id AND events.user_id = auth.uid())
  );

-- Anon read for guest-facing Find Your Seat
DROP POLICY IF EXISTS "read_guests_anon" ON guests;
CREATE POLICY "read_guests_anon" ON guests FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_event_name ON guests(event_id, name);
