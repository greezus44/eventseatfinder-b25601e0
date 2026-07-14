-- Add typography columns for per-element font customization
ALTER TABLE guest_page_settings
  ADD COLUMN IF NOT EXISTS font_title_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_title_size integer DEFAULT 32,
  ADD COLUMN IF NOT EXISTS font_title_weight integer DEFAULT 700,
  ADD COLUMN IF NOT EXISTS font_subtitle_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_subtitle_size integer DEFAULT 16,
  ADD COLUMN IF NOT EXISTS font_subtitle_weight integer DEFAULT 400,
  ADD COLUMN IF NOT EXISTS font_datetime_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_datetime_size integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS font_datetime_weight integer DEFAULT 400,
  ADD COLUMN IF NOT EXISTS font_venue_family text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_venue_size integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS font_venue_weight integer DEFAULT 400;
