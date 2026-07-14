export interface Event {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  logo_url: string | null;
  cover_url: string | null;
  accent_color: string | null;
  invitation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  table_id: string | null;
  created_at: string;
}

export interface Table {
  id: string;
  event_id: string;
  name: string;
  number: number;
  capacity: number;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
}

export interface Rsvp {
  id: string;
  event_id: string;
  guest_id: string;
  status: string;
  plus_ones: number;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  event_id: string;
  guest_id: string;
  checked_in_at: string;
  plus_ones_actual: number;
}

export interface GuestPageSettings {
  id: string;
  event_id: string;
  logo_url: string;
  logo_size: number | null;
  logo_position: string | null;
  logo_rounded: boolean | null;
  color_primary: string;
  color_background: string;
  color_card: string;
  color_button: string;
  color_button_text: string;
  color_header: string;
  color_text: string;
  color_link: string;
  font_heading: string;
  font_body: string;
  font_button: string;
  font_heading_size: number;
  font_body_size: number;
  font_heading_weight: number;
  font_body_weight: number;
  font_heading_spacing: number;
  font_body_spacing: number;
  font_heading_line_height: number;
  font_body_line_height: number;
  border_radius: number;
  card_shadow: boolean;
  button_style: string;
  background_image: string;
  background_overlay_opacity: number;
  venue_image_url: string;
  created_at: string;
  updated_at: string;
  color_secondary: string;
  color_footer: string;
  cover_image: string;
  banner_height: number;
  welcome_message: string;
  event_subtitle: string;
  enable_schedule: boolean;
  enable_gallery: boolean;
  schedule_items: unknown;
  gallery_images: unknown;
  font_title_family: string;
  font_title_size: number;
  font_title_weight: number;
  font_subtitle_family: string;
  font_subtitle_size: number;
  font_subtitle_weight: number;
  font_datetime_family: string;
  font_datetime_size: number;
  font_datetime_weight: number;
  font_venue_family: string;
  font_venue_size: number;
  font_venue_weight: number;
}

export interface EventInput {
  name?: string;
  slug?: string;
  date?: string | null;
  time?: string | null;
  venue?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  accent_color?: string | null;
  invitation_enabled?: boolean;
}

export interface GuestInput {
  name?: string;
  table_id?: string | null;
}

export interface TableInput {
  name?: string;
  number?: number;
  capacity?: number;
  position_x?: number | null;
  position_y?: number | null;
}

export interface GuestPageSettingsInput {
  logo_url?: string;
  logo_size?: number | null;
  logo_position?: string | null;
  logo_rounded?: boolean | null;
  color_primary?: string;
  color_background?: string;
  color_card?: string;
  color_button?: string;
  color_button_text?: string;
  color_header?: string;
  color_text?: string;
  color_link?: string;
  font_heading?: string;
  font_body?: string;
  font_button?: string;
  font_heading_size?: number;
  font_body_size?: number;
  font_heading_weight?: number;
  font_body_weight?: number;
  font_heading_spacing?: number;
  font_body_spacing?: number;
  font_heading_line_height?: number;
  font_body_line_height?: number;
  border_radius?: number;
  card_shadow?: boolean;
  button_style?: string;
  background_image?: string;
  background_overlay_opacity?: number;
  venue_image_url?: string;
  color_secondary?: string;
  color_footer?: string;
  cover_image?: string;
  banner_height?: number;
  welcome_message?: string;
  event_subtitle?: string;
  enable_schedule?: boolean;
  enable_gallery?: boolean;
  schedule_items?: unknown;
  gallery_images?: unknown;
  font_title_family?: string;
  font_title_size?: number;
  font_title_weight?: number;
  font_subtitle_family?: string;
  font_subtitle_size?: number;
  font_subtitle_weight?: number;
  font_datetime_family?: string;
  font_datetime_size?: number;
  font_datetime_weight?: number;
  font_venue_family?: string;
  font_venue_size?: number;
  font_venue_weight?: number;
}
