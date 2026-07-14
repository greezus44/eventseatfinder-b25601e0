/*
# Fix RLS Policies with Unrestricted Access

## Problem
Five RLS policies on `check_ins` and `rsvps` used `USING (true)` or `WITH CHECK (true)`,
allowing unrestricted access for anon and authenticated roles. This bypasses row-level
security entirely for those operations.

## Changes

### check_ins table
1. **DROP** `delete_check_ins_anon` (DELETE, USING true) — check-in management is
   host-only (behind authenticated routes). The owner-scoped `delete_own_check_ins`
   policy already handles authenticated access.
2. **DROP** `insert_check_ins_anon` (INSERT, WITH CHECK true) — same reasoning;
   `insert_own_check_ins` covers authenticated hosts.
3. **DROP** `update_check_ins_anon` (UPDATE, USING/WITH CHECK true) — same reasoning;
   `update_own_check_ins` covers authenticated hosts.

### rsvps table
4. **REPLACE** `insert_rsvps_anon` (INSERT, WITH CHECK true) → new policy that checks
   the referenced event exists. Guests submit RSVPs via the public guest page, so anon
   INSERT must remain available — but only for real events, not unrestricted.
5. **REPLACE** `update_rsvps_anon` (UPDATE, USING/WITH CHECK true) → new policy that
   checks the referenced event exists. Guests may update their RSVP via the public page.

### Policies NOT changed
- `read_check_ins_anon` / `read_rsvps_anon` (SELECT with USING true) — public read
  access is intentional: the guest page displays check-in counts and RSVP info.
- All `*_own_*` owner-scoped policies — these already have proper `EXISTS` ownership
  checks via `events.user_id = auth.uid()`.
- `delete_own_rsvps` — no anon DELETE policy exists (only owner-scoped), which is correct.

## Security Impact
After this migration, anon users can:
- READ check_ins and rsvps (public, for guest page display)
- INSERT/UPDATE rsvps only when the referenced event exists
- NOT insert, update, or delete check_ins (host-only operations)

Authenticated hosts retain all existing capabilities through the owner-scoped policies.
*/

-- ============================================================
-- check_ins: Drop permissive anon INSERT/UPDATE/DELETE policies
-- ============================================================

DROP POLICY IF EXISTS "insert_check_ins_anon" ON check_ins;
DROP POLICY IF EXISTS "update_check_ins_anon" ON check_ins;
DROP POLICY IF EXISTS "delete_check_ins_anon" ON check_ins;

-- ============================================================
-- rsvps: Replace permissive anon INSERT/UPDATE with event-existence checks
-- ============================================================

DROP POLICY IF EXISTS "insert_rsvps_anon" ON rsvps;
CREATE POLICY "insert_rsvps_anon" ON rsvps FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvps.event_id
    )
  );

DROP POLICY IF EXISTS "update_rsvps_anon" ON rsvps;
CREATE POLICY "update_rsvps_anon" ON rsvps FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvps.event_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvps.event_id
    )
  );
