
-- Create private schema for security-definer helpers so they are not exposed on the public API surface.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

-- Move set_updated_at trigger fn out of public API and lock down execute.
ALTER FUNCTION public.set_updated_at() SET search_path = public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Recreate helpers in private schema.
CREATE OR REPLACE FUNCTION private.search_event_guests(_slug text, _q text)
RETURNS TABLE(id uuid, full_name text, table_id uuid, personal_message text, meal_choice text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT g.id, g.full_name, g.table_id, g.personal_message, g.meal_choice
  FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  WHERE e.slug = _slug
    AND e.is_published = true
    AND length(btrim(_q)) >= 2
    AND g.full_name ILIKE '%' || btrim(_q) || '%'
  ORDER BY g.full_name
  LIMIT 8;
$$;

CREATE OR REPLACE FUNCTION private.get_collaborator_invite(_token text)
RETURNS TABLE(id uuid, event_id uuid, invited_email text, status text, event_name text, event_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.event_id, c.invited_email, c.status, e.name, e.slug
  FROM public.event_collaborators c
  JOIN public.events e ON e.id = c.event_id
  WHERE c.invite_token = _token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.accept_collaborator_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_event uuid;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.event_collaborators
     SET status = 'accepted', user_id = v_uid, accepted_at = now()
   WHERE invite_token = _token AND lower(invited_email) = v_email AND status <> 'accepted'
  RETURNING event_id INTO v_event;
  IF v_event IS NULL THEN
    SELECT event_id INTO v_event FROM public.event_collaborators
      WHERE invite_token = _token AND lower(invited_email) = v_email;
    IF v_event IS NULL THEN RAISE EXCEPTION 'invite mismatch'; END IF;
  END IF;
  RETURN v_event;
END;
$$;

REVOKE ALL ON FUNCTION private.search_event_guests(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.get_collaborator_invite(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.accept_collaborator_invite(text) FROM PUBLIC, anon, authenticated;

-- Drop old public definer versions.
DROP FUNCTION IF EXISTS public.search_event_guests(text, text);
DROP FUNCTION IF EXISTS public.get_collaborator_invite(text);
DROP FUNCTION IF EXISTS public.accept_collaborator_invite(text);

-- Public thin invoker wrappers exposed on the API.
CREATE OR REPLACE FUNCTION public.search_event_guests(_slug text, _q text)
RETURNS TABLE(id uuid, full_name text, table_id uuid, personal_message text, meal_choice text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT * FROM private.search_event_guests(_slug, _q); $$;

CREATE OR REPLACE FUNCTION public.get_collaborator_invite(_token text)
RETURNS TABLE(id uuid, event_id uuid, invited_email text, status text, event_name text, event_slug text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT * FROM private.get_collaborator_invite(_token); $$;

CREATE OR REPLACE FUNCTION public.accept_collaborator_invite(_token text)
RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT private.accept_collaborator_invite(_token); $$;

-- Wrappers themselves can be called by API roles; the underlying definer body enforces scope.
REVOKE ALL ON FUNCTION public.search_event_guests(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_collaborator_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_collaborator_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_event_guests(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_collaborator_invite(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_collaborator_invite(text) TO authenticated;
