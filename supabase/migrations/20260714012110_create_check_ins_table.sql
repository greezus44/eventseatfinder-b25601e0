/*
# Create check_ins table

## Purpose
Stores guest check-in records for day-of event management. Each check-in
records when a guest arrived and how many plus-ones actually attended.

## New Tables
- `check_ins`
  - `id` (uuid, primary key)
  - `event_id` (uuid, not null — FK to events.id, ON DELETE CASCADE)
  - `guest_id` (uuid, not null — FK to guests.id, ON DELETE CASCADE)
  - `checked_in_at` (timestamptz, default now() — when the guest checked in)
  - `plus_ones_actual` (int, default 0 — actual plus-ones who showed up)
  - Unique constraint on (event_id, guest_id) — one check-in per guest per event

## Security
- RLS enabled on `check_ins`.
- Owner-scoped CRUD via ownership check through the parent event.
- Anon INSERT/SELECT/UPDATE/DELETE so organizers can manage check-ins
  from the authenticated app and guests can be checked in without
  requiring a separate auth context.

## Important Notes
1. Index on event_id for efficient lookups.
2. Unique constraint prevents duplicate check-ins.
*/

CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  plus_ones_actual int NOT NULL DEFAULT 0,
  UNIQUE (event_id, guest_id)
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Owner-scoped policies (through event ownership)
DROP POLICY IF EXISTS "select_own_check_ins" ON check_ins;
CREATE POLICY "select_own_check_ins" ON check_ins FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = check_ins.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_check_ins" ON check_ins;
CREATE POLICY "insert_own_check_ins" ON check_ins FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = check_ins.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_check_ins" ON check_ins;
CREATE POLICY "update_own_check_ins" ON check_ins FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = check_ins.event_id AND events.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = check_ins.event_id AND events.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_check_ins" ON check_ins;
CREATE POLICY "delete_own_check_ins" ON check_ins FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = check_ins.event_id AND events.user_id = auth.uid())
  );

-- Anon access for check-in management
DROP POLICY IF EXISTS "read_check_ins_anon" ON check_ins;
CREATE POLICY "read_check_ins_anon" ON check_ins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_check_ins_anon" ON check_ins;
CREATE POLICY "insert_check_ins_anon" ON check_ins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_check_ins_anon" ON check_ins;
CREATE POLICY "update_check_ins_anon" ON check_ins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_check_ins_anon" ON check_ins;
CREATE POLICY "delete_check_ins_anon" ON check_ins FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_check_ins_event_id ON check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_guest_id ON check_ins(guest_id);
