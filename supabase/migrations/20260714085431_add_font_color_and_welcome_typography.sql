-- Add font color columns for each typography element
ALTER TABLE guest_page_settings
  ADD COLUMN IF NOT EXISTS font_title_color text,
  ADD COLUMN IF NOT EXISTS font_subtitle_color text,
  ADD COLUMN IF NOT EXISTS font_datetime_color text,
  ADD COLUMN IF NOT EXISTS font_venue_color text,
  ADD COLUMN IF NOT EXISTS font_welcome_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_welcome_size integer DEFAULT 16,
  ADD COLUMN IF NOT EXISTS font_welcome_weight integer DEFAULT 400,
  ADD COLUMN IF NOT EXISTS font_welcome_color text;
