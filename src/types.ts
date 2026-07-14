export interface Event {
  id: string
  user_id: string
  name: string
  slug: string
  date: string | null
  time: string | null
  venue: string | null
  logo_url: string | null
  cover_url: string | null
  accent_color: string | null
  invitation_enabled: boolean
  created_at: string
  updated_at: string
}

export interface EventInput {
  name: string
  slug: string
  date?: string | null
  time?: string | null
  venue?: string | null
  logo_url?: string | null
  cover_url?: string | null
  accent_color?: string | null
}

export interface Table {
  id: string
  event_id: string
  name: string
  number: number
  capacity: number
  position_x: number | null
  position_y: number | null
  created_at: string
}

export interface TableInput {
  name: string
  number: number
  capacity: number
  event_id?: string
}

export interface Guest {
  id: string
  event_id: string
  name: string
  table_id: string | null
  created_at: string
}

export interface GuestInput {
  name: string
  event_id?: string
  table_id?: string | null
}

export interface GuestPageSettings {
  id: string
  event_id: string
  logo_url: string | null
  logo_size: number | null
  logo_position: string | null
  logo_rounded: boolean | null
  color_primary: string | null
  color_background: string | null
  color_card: string | null
  color_button: string | null
  color_button_text: string | null
  color_header: string | null
  color_text: string | null
  color_link: string | null
  color_secondary: string | null
  color_footer: string | null
  font_heading: string | null
  font_body: string | null
  font_button: string | null
  font_heading_size: number | null
  font_body_size: number | null
  font_heading_weight: number | null
  font_body_weight: number | null
  font_heading_spacing: number | null
  font_body_spacing: number | null
  font_heading_line_height: number | null
  font_body_line_height: number | null
  border_radius: number | null
  card_shadow: string | null
  button_style: string | null
  background_image: string | null
  background_overlay_opacity: number | null
  venue_image_url: string | null
  cover_image: string | null
  banner_height: number | null
  welcome_message: string | null
  event_subtitle: string | null
  enable_schedule: boolean | null
  enable_gallery: boolean | null
  schedule_items: unknown | null
  gallery_images: unknown | null
  font_title_family: string | null
  font_title_size: number | null
  font_title_weight: number | null
  font_subtitle_family: string | null
  font_subtitle_size: number | null
  font_subtitle_weight: number | null
  font_datetime_family: string | null
  font_datetime_size: number | null
  font_datetime_weight: number | null
  font_venue_family: string | null
  font_venue_size: number | null
  font_venue_weight: number | null
  font_title_color: string | null
  font_subtitle_color: string | null
  font_datetime_color: string | null
  font_venue_color: string | null
  font_welcome_family: string | null
  font_welcome_size: number | null
  font_welcome_weight: number | null
  font_welcome_color: string | null
  created_at: string | null
  updated_at: string | null
}

export interface GuestPageSettingsInput {
  event_id?: string
  logo_url?: string | null
  logo_size?: number
  logo_position?: string
  logo_rounded?: boolean
  color_primary?: string
  color_background?: string
  color_card?: string
  color_button?: string
  color_button_text?: string
  color_header?: string
  color_text?: string
  color_link?: string
  color_secondary?: string
  color_footer?: string
  font_heading?: string
  font_body?: string
  font_button?: string
  font_heading_size?: number
  font_body_size?: number
  font_heading_weight?: number
  font_body_weight?: number
  font_heading_spacing?: number
  font_body_spacing?: number
  font_heading_line_height?: number
  font_body_line_height?: number
  border_radius?: number
  card_shadow?: string
  button_style?: string
  background_image?: string | null
  background_overlay_opacity?: number
  venue_image_url?: string | null
  cover_image?: string | null
  banner_height?: number
  welcome_message?: string | null
  event_subtitle?: string | null
  enable_schedule?: boolean
  enable_gallery?: boolean
  schedule_items?: unknown
  gallery_images?: unknown
  font_title_family?: string
  font_title_size?: number
  font_title_weight?: number
  font_subtitle_family?: string
  font_subtitle_size?: number
  font_subtitle_weight?: number
  font_datetime_family?: string
  font_datetime_size?: number
  font_datetime_weight?: number
  font_venue_family?: string
  font_venue_size?: number
  font_venue_weight?: number
  font_title_color?: string
  font_subtitle_color?: string
  font_datetime_color?: string
  font_venue_color?: string
  font_welcome_family?: string
  font_welcome_size?: number
  font_welcome_weight?: number
  font_welcome_color?: string
}
