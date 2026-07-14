/*
# Add premium guest page customisation columns

1. Modified Tables
- `guest_page_settings` — adds columns for the premium guest page redesign:
  - `color_secondary` (text, default '#115e59') — secondary brand colour
  - `color_footer` (text, default '#0f172a') — footer background colour
  - `cover_image` (text, nullable) — full-width hero cover image URL (separate from background_image)
  - `banner_height` (integer, default 400) — hero banner height in px
  - `welcome_message` (text, nullable) — optional welcome text shown in hero
  - `event_subtitle` (text, nullable) — subtitle below event title in hero
  - `enable_schedule` (boolean, default false) — show Schedule section
  - `enable_gallery` (boolean, default false) — show Gallery section
  - `schedule_items` (jsonb, nullable) — array of {time, title, description} objects
  - `gallery_images` (jsonb, nullable) — array of image URL strings

2. Security
- No RLS policy changes — existing policies cover the new columns automatically.
*/

ALTER TABLE guest_page_settings
  ADD COLUMN IF NOT EXISTS color_secondary text DEFAULT '#115e59',
  ADD COLUMN IF NOT EXISTS color_footer text DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS banner_height integer DEFAULT 400,
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS event_subtitle text,
  ADD COLUMN IF NOT EXISTS enable_schedule boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_gallery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_items jsonb,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb;
