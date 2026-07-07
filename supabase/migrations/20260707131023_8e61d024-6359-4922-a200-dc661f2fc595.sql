
-- Remove public read of guests
DROP POLICY IF EXISTS "Public read guests of published events" ON public.guests;

-- Secure search function: only returns matching guests for published events
CREATE OR REPLACE FUNCTION public.search_event_guests(_slug text, _q text)
RETURNS TABLE (
  id uuid,
  full_name text,
  table_id uuid,
  personal_message text,
  meal_choice text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.search_event_guests(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_event_guests(text, text) TO anon, authenticated;
