
-- 1) Remove broad public SELECT policy on guests; rely on SECURITY DEFINER function
DROP POLICY IF EXISTS "Public read guests of published events" ON public.guests;

-- Restore SECURITY DEFINER on the search function so anon can look up by name
-- without needing a broad SELECT policy. The function itself scopes to published
-- events, requires a >=2-char query, and limits to 8 rows.
CREATE OR REPLACE FUNCTION public.search_event_guests(_slug text, _q text)
RETURNS TABLE(id uuid, full_name text, table_id uuid, personal_message text, meal_choice text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Anon no longer needs table SELECT via policy for guests
REVOKE SELECT ON public.guests FROM anon;

-- 2) Collaborator invite lookup by token — replace open SELECT with definer function
DROP POLICY IF EXISTS "Anyone can look up a collaborator invite by token" ON public.event_collaborators;

CREATE OR REPLACE FUNCTION public.get_collaborator_invite(_token text)
RETURNS TABLE(id uuid, event_id uuid, invited_email text, status text, event_name text, event_slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT c.id, c.event_id, c.invited_email, c.status, e.name, e.slug
  FROM public.event_collaborators c
  JOIN public.events e ON e.id = c.event_id
  WHERE c.invite_token = _token
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_collaborator_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_collaborator_invite(text) TO anon, authenticated;

-- Definer function used to accept an invite by token (verifies the caller's email
-- matches the invited_email — signed-in only).
CREATE OR REPLACE FUNCTION public.accept_collaborator_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_event uuid;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.event_collaborators
     SET status = 'accepted',
         user_id = v_uid,
         accepted_at = now()
   WHERE invite_token = _token
     AND lower(invited_email) = v_email
     AND status <> 'accepted'
  RETURNING event_id INTO v_event;

  IF v_event IS NULL THEN
    -- Either wrong email, already accepted, or bad token
    SELECT event_id INTO v_event FROM public.event_collaborators
      WHERE invite_token = _token AND lower(invited_email) = v_email;
    IF v_event IS NULL THEN
      RAISE EXCEPTION 'invite mismatch';
    END IF;
  END IF;

  RETURN v_event;
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_collaborator_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_collaborator_invite(text) TO authenticated;

-- Anon no longer needs table SELECT on event_collaborators
REVOKE SELECT ON public.event_collaborators FROM anon;

-- 3) Per-text-role font choices
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS font_title text,
  ADD COLUMN IF NOT EXISTS font_subtitle text,
  ADD COLUMN IF NOT EXISTS font_body text;
