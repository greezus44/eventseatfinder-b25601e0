ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS logo_size text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS layout_image_url text;