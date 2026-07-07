
-- helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  event_date DATE,
  -- guest-facing customization
  headline TEXT,
  subheadline TEXT,
  welcome_message TEXT,
  footer_note TEXT,
  hero_image_url TEXT,
  logo_url TEXT,
  accent_color TEXT NOT NULL DEFAULT '#111111',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#111111',
  font_style TEXT NOT NULL DEFAULT 'sans',
  venue_name TEXT,
  venue_address TEXT,
  schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_info TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published events"
  ON public.events FOR SELECT TO anon, authenticated
  USING (is_published = true OR owner_id = auth.uid());
CREATE POLICY "Owner insert events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner update events"
  ON public.events FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner delete events"
  ON public.events FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TABLES
CREATE TABLE public.event_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  location_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX event_tables_event_id_idx ON public.event_tables(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_tables TO authenticated;
GRANT SELECT ON public.event_tables TO anon;
GRANT ALL ON public.event_tables TO service_role;
ALTER TABLE public.event_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tables of published events"
  ON public.event_tables FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.events e
     WHERE e.id = event_id AND (e.is_published = true OR e.owner_id = auth.uid())));
CREATE POLICY "Owner manage tables"
  ON public.event_tables FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()));

CREATE TRIGGER event_tables_updated_at BEFORE UPDATE ON public.event_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GUESTS
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.event_tables(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  personal_message TEXT,
  meal_choice TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX guests_event_id_idx ON public.guests(event_id);
CREATE INDEX guests_name_idx ON public.guests USING gin (to_tsvector('simple', full_name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO authenticated;
GRANT SELECT ON public.guests TO anon;
GRANT ALL ON public.guests TO service_role;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read guests of published events"
  ON public.guests FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.events e
     WHERE e.id = event_id AND (e.is_published = true OR e.owner_id = auth.uid())));
CREATE POLICY "Owner manage guests"
  ON public.guests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()));

CREATE TRIGGER guests_updated_at BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
