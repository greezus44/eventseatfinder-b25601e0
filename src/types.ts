// ── Events ──────────────────────────────────────────────
export interface Event {
  id: string;
  name: string;
  slug: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  venue_image_url: string | null;
  user_id: string;
  created_at: string;
}

export interface EventInput {
  name?: string;
  slug?: string;
  date?: string | null;
  time?: string | null;
  venue?: string | null;
  venue_image_url?: string | null;
}

// ── Guests ───────────────────────────────────────────────
export interface Guest {
  id: string;
  event_id: string;
  name: string;
  table_id: string | null;
  created_at: string;
}

export interface GuestInput {
  name: string;
  table_id: string | null;
}

// ── Tables ───────────────────────────────────────────────
export interface Table {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  x: number | null;
  y: number | null;
  created_at: string;
}

export interface TableInput {
  name: string;
  capacity: number;
  x?: number | null;
  y?: number | null;
}

// ── RSVPs ────────────────────────────────────────────────
export interface Rsvp {
  id: string;
  guest_id: string;
  status: 'yes' | 'no' | 'maybe' | null;
  party_size: number | null;
  created_at: string;
}

export interface RsvpInput {
  guest_id: string;
  status: 'yes' | 'no' | 'maybe' | null;
  party_size?: number | null;
}

// ── Check-ins ────────────────────────────────────────────
export interface CheckIn {
  id: string;
  guest_id: string;
  checked_in_at: string;
}

// ── Guest Page Settings ──────────────────────────────────
export interface GuestPageSettings {
  id: string;
  event_id: string;
  color_primary: string | null;
  color_background: string | null;
  color_card: string | null;
  color_text: string | null;
  color_header: string | null;
  border_radius: number | null;
  logo_url: string | null;
  logo_size: number | null;
  logo_rounded: boolean | null;
  venue_image_url: string | null;
  welcome_message: string | null;
  event_subtitle: string | null;
  // Typography — title
  font_title_family: string | null;
  font_title_size: number | null;
  font_title_weight: number | null;
  // Typography — subtitle
  font_subtitle_family: string | null;
  font_subtitle_size: number | null;
  font_subtitle_weight: number | null;
  // Typography — datetime
  font_datetime_family: string | null;
  font_datetime_size: number | null;
  font_datetime_weight: number | null;
  // Typography — venue
  font_venue_family: string | null;
  font_venue_size: number | null;
  font_venue_weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface GuestPageSettingsInput {
  event_id?: string;
  color_primary?: string | null;
  color_background?: string | null;
  color_card?: string | null;
  color_text?: string | null;
  color_header?: string | null;
  border_radius?: number | null;
  logo_url?: string | null;
  logo_size?: number | null;
  logo_rounded?: boolean | null;
  venue_image_url?: string | null;
  welcome_message?: string | null;
  event_subtitle?: string | null;
  font_title_family?: string | null;
  font_title_size?: number | null;
  font_title_weight?: number | null;
  font_subtitle_family?: string | null;
  font_subtitle_size?: number | null;
  font_subtitle_weight?: number | null;
  font_datetime_family?: string | null;
  font_datetime_size?: number | null;
  font_datetime_weight?: number | null;
  font_venue_family?: string | null;
  font_venue_size?: number | null;
  font_venue_weight?: number | null;
}
