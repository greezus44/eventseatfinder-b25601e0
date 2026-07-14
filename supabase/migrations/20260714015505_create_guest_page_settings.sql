/*
# Create guest_page_settings table

1. New Tables
- `guest_page_settings` — stores per-event customisation for the guest-facing page
  - `event_id` (uuid, NOT NULL, references events.id ON DELETE CASCADE, UNIQUE)
  - Branding: `logo_url`, `logo_size` (px, default 80), `logo_position` (left/center/right), `logo_rounded` (boolean)
  - Colours: `color_primary`, `color_background`, `color_card`, `color_button`, `color_button_text`, `color_header`, `color_text`, `color_link` (all text, with sensible defaults matching Seatly's teal theme)
  - Typography: `font_heading`, `font_body`, `font_button` (Google Font names, default Inter), `font_heading_size`, `font_body_size` (px), `font_heading_weight`, `font_body_weight`, `font_heading_spacing`, `font_body_spacing` (letter spacing px), `font_heading_line_height`, `font_body_line_height`
  - Appearance: `border_radius` (px, default 16), `card_shadow` (none/sm/md/lg), `button_style` (filled/outlined/rounded), `background_image` (URL), `background_overlay_opacity` (0-100)
  - Venue: `venue_image_url` (URL for the venue layout background image)
  - Timestamps: `created_at`, `updated_at`

2. Security
- Enable RLS on `guest_page_settings`.
- SELECT: TO anon, authenticated — guest-facing pages (no auth) need to read settings.
- INSERT/UPDATE/DELETE: TO authenticated, ownership verified through the events table (event.user_id = auth.uid()).
*/

CREATE TABLE IF NOT EXISTS guest_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  -- Branding
  logo_url text,
  logo_size integer DEFAULT 80,
  logo_position text DEFAULT 'center',
  logo_rounded boolean DEFAULT false,
  -- Colours
  color_primary text DEFAULT '#0f766e',
  color_background text DEFAULT '#f8fafc',
  color_card text DEFAULT '#ffffff',
  color_button text DEFAULT '#0f766e',
  color_button_text text DEFAULT '#ffffff',
  color_header text DEFAULT '#ffffff',
  color_text text DEFAULT '#0f172a',
  color_link text DEFAULT '#0f766e',
  -- Typography
  font_heading text DEFAULT 'Inter',
  font_body text DEFAULT 'Inter',
  font_button text DEFAULT 'Inter',
  font_heading_size integer DEFAULT 48,
  font_body_size integer DEFAULT 16,
  font_heading_weight integer DEFAULT 700,
  font_body_weight integer DEFAULT 400,
  font_heading_spacing numeric DEFAULT 0,
  font_body_spacing numeric DEFAULT 0,
  font_heading_line_height numeric DEFAULT 1.2,
  font_body_line_height numeric DEFAULT 1.5,
  -- Appearance
  border_radius integer DEFAULT 16,
  card_shadow text DEFAULT 'md',
  button_style text DEFAULT 'filled',
  background_image text,
  background_overlay_opacity integer DEFAULT 0,
  -- Venue layout
  venue_image_url text,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

ALTER TABLE guest_page_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: guests (anon) and hosts (authenticated) can read settings
DROP POLICY IF EXISTS "read_guest_page_settings" ON guest_page_settings;
CREATE POLICY "read_guest_page_settings"
ON guest_page_settings FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: only event owner can create settings
DROP POLICY IF EXISTS "insert_own_guest_page_settings" ON guest_page_settings;
CREATE POLICY "insert_own_guest_page_settings"
ON guest_page_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = guest_page_settings.event_id
    AND events.user_id = auth.uid()
  )
);

-- UPDATE: only event owner can update settings
DROP POLICY IF EXISTS "update_own_guest_page_settings" ON guest_page_settings;
CREATE POLICY "update_own_guest_page_settings"
ON guest_page_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = guest_page_settings.event_id
    AND events.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = guest_page_settings.event_id
    AND events.user_id = auth.uid()
  )
);

-- DELETE: only event owner can delete settings
DROP POLICY IF EXISTS "delete_own_guest_page_settings" ON guest_page_settings;
CREATE POLICY "delete_own_guest_page_settings"
ON guest_page_settings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = guest_page_settings.event_id
    AND events.user_id = auth.uid()
  )
);
