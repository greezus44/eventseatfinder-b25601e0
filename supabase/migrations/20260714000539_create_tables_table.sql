/*
# Create tables table (event seating tables)

## Purpose
Stores the physical tables at an event (e.g. "Table 1", "Head Table").
Each table belongs to an event and has a capacity and optional position
for the venue layout feature.

## New Tables
- `tables`
  - `id` (uuid, primary key)
  - `event_id` (uuid, not null — FK to events.id, ON DELETE CASCADE)
  - `name` (text, not null — display name, e.g. "Table 1")
  - `number` (int, not null — numeric table number for guest display)
  - `capacity` (int, default 8 — max seats at this table)
  - `position_x` (float, nullable — X coordinate on venue layout)
  - `position_y` (float, nullable — Y coordinate on venue layout)
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled on `tables`.
- Owner-scoped CRUD via ownership check through the parent event:
  `EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.user_id = auth.uid())`
- Anon SELECT so guests on the Find Your Seat page can see table names/numbers.

## Important Notes
1. Unique constraint on (event_id, number) prevents duplicate table numbers per event.
2. Unique constraint on (event_id, name) prevents duplicate table names per event.
3. Index on event_id for efficient lookups.
*/

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  number int NOT NULL,
  capacity int NOT NULL DEFAULT 8,
  position_x float,
  position_y float,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, number),
  UNIQUE (event_id, name)
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies (through event ownership)
DROP POLICY IF EXISTS "select_own_tables" ON tables;
CREATE POLICY "select_own_tables" ON tables FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_tables" ON tables;
CREATE POLICY "insert_own_tables" ON tables FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_tables" ON tables;
CREATE POLICY "update_own_tables" ON tables FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_tables" ON tables;
CREATE POLICY "delete_own_tables" ON tables FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = tables.event_id AND events.user_id = auth.uid())
  );

-- Anon read for guest-facing Find Your Seat
DROP POLICY IF EXISTS "read_tables_anon" ON tables;
CREATE POLICY "read_tables_anon" ON tables FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_tables_event_id ON tables(event_id);
