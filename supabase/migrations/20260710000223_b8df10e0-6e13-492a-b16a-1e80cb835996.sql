
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_time text,
  ADD COLUMN IF NOT EXISTS title_scale numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS subtitle_scale numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS body_scale numeric NOT NULL DEFAULT 1;
