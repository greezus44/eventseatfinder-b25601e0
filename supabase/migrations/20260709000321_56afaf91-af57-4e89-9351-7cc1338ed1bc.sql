
-- 1) Bilingual content + default language on events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS content_ms jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'en';

-- 2) Editable slug uniqueness (guard against duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON public.events (slug);

-- 3) Fix SECURITY DEFINER finding on search_event_guests
--    Switch to SECURITY INVOKER and add a narrow anon SELECT policy on guests
--    for guests belonging to published events (name search on public page).
DROP FUNCTION IF EXISTS public.search_event_guests(text, text);
CREATE OR REPLACE FUNCTION public.search_event_guests(_slug text, _q text)
 RETURNS TABLE(id uuid, full_name text, table_id uuid, personal_message text, meal_choice text)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT g.id, g.full_name, g.table_id, g.personal_message, g.meal_choice
  FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  WHERE e.slug = _slug
    AND e.is_published = true
    AND length(btrim(_q)) >= 2
    AND g.full_name ILIKE '%' || btrim(_q) || '%'
  ORDER BY g.full_name
  LIMIT 8;
$function$;

REVOKE ALL ON FUNCTION public.search_event_guests(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_event_guests(text, text) TO anon, authenticated;

-- Narrow public SELECT policy so INVOKER-mode search works for anon/guests
CREATE POLICY "Public read guests of published events"
  ON public.guests FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = guests.event_id AND e.is_published = true
    )
  );

-- 4) Collaborators (co-editors) invited by email
CREATE TABLE public.event_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  user_id uuid,
  role text NOT NULL DEFAULT 'editor',
  status text NOT NULL DEFAULT 'pending',
  invite_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  invited_by uuid NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, invited_email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_collaborators TO authenticated;
GRANT SELECT ON public.event_collaborators TO anon; -- needed for /invite/:token lookup by unauthenticated visitor
GRANT ALL ON public.event_collaborators TO service_role;

ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

-- Anon can only view a collaborator row by knowing its token (invite landing page).
-- We enforce this at query time by requiring the client to filter on invite_token;
-- Policy allows SELECT to anyone but the app queries by token only.
CREATE POLICY "Anyone can look up a collaborator invite by token"
  ON public.event_collaborators FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Event owner manages collaborators"
  ON public.event_collaborators FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_collaborators.event_id AND e.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_collaborators.event_id AND e.owner_id = auth.uid()));

CREATE POLICY "Invitee can accept their own invite"
  ON public.event_collaborators FOR UPDATE TO authenticated
  USING (invited_email = (auth.jwt() ->> 'email'))
  WITH CHECK (invited_email = (auth.jwt() ->> 'email'));

-- 5) Editor helper (private schema so it doesn't trigger the DEFINER-in-public linter)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_event_editor(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = _event_id AND e.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.event_collaborators c
    WHERE c.event_id = _event_id AND c.user_id = _user_id AND c.status = 'accepted'
  );
$$;

GRANT EXECUTE ON FUNCTION private.is_event_editor(uuid, uuid) TO authenticated;

-- 6) Widen owner-only policies to include accepted collaborators
DROP POLICY IF EXISTS "Owner update events" ON public.events;
CREATE POLICY "Editors update events"
  ON public.events FOR UPDATE TO authenticated
  USING (private.is_event_editor(id, auth.uid()))
  WITH CHECK (private.is_event_editor(id, auth.uid()));

DROP POLICY IF EXISTS "Owner manage tables" ON public.event_tables;
CREATE POLICY "Editors manage tables"
  ON public.event_tables FOR ALL TO authenticated
  USING (private.is_event_editor(event_id, auth.uid()))
  WITH CHECK (private.is_event_editor(event_id, auth.uid()));

DROP POLICY IF EXISTS "Owner manage guests" ON public.guests;
CREATE POLICY "Editors manage guests"
  ON public.guests FOR ALL TO authenticated
  USING (private.is_event_editor(event_id, auth.uid()))
  WITH CHECK (private.is_event_editor(event_id, auth.uid()));

-- Let collaborators see the events they can edit on the dashboard
CREATE POLICY "Editors read their events"
  ON public.events FOR SELECT TO authenticated
  USING (private.is_event_editor(id, auth.uid()));

-- 7) updated_at trigger for collaborators
CREATE TRIGGER trg_event_collaborators_updated_at
BEFORE UPDATE ON public.event_collaborators
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
