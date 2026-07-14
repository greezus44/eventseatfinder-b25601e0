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

export interface Guest {
  id: string
  event_id: string
  name: string
  table_id: string | null
  created_at: string
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
  cover_image: string | null
  banner_height: number | null
  welcome_message: string | null
  event_subtitle: string | null
  enable_schedule: boolean | null
  enable_gallery: boolean | null
  schedule_items: Record<string, unknown>[] | null
  gallery_images: string[] | null
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
  venue_image_url: string | null
  border_radius: number | null
  card_shadow: string | null
  button_style: string | null
  background_image: string | null
  background_overlay_opacity: number | null
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
  created_at: string | null
  updated_at: string | null
}

export interface EventInput {
  name?: string
  slug?: string
  date?: string | null
  time?: string | null
  venue?: string | null
  logo_url?: string | null
  cover_url?: string | null
  accent_color?: string | null
  invitation_enabled?: boolean
}

export interface TableInput {
  event_id?: string
  name?: string
  number?: number
  capacity?: number
  position_x?: number | null
  position_y?: number | null
}

export interface GuestInput {
  event_id?: string
  name?: string
  table_id?: string | null
}

export interface GuestPageSettingsInput {
  event_id?: string
  logo_url?: string | null
  logo_size?: number | null
  logo_position?: string | null
  logo_rounded?: boolean | null
  color_primary?: string | null
  color_background?: string | null
  color_card?: string | null
  color_button?: string | null
  color_button_text?: string | null
  color_header?: string | null
  color_text?: string | null
  color_link?: string | null
  color_secondary?: string | null
  color_footer?: string | null
  cover_image?: string | null
  banner_height?: number | null
  welcome_message?: string | null
  event_subtitle?: string | null
  enable_schedule?: boolean | null
  enable_gallery?: boolean | null
  schedule_items?: Record<string, unknown>[] | null
  gallery_images?: string[] | null
  font_title_family?: string | null
  font_title_size?: number | null
  font_title_weight?: number | null
  font_subtitle_family?: string | null
  font_subtitle_size?: number | null
  font_subtitle_weight?: number | null
  font_datetime_family?: string | null
  font_datetime_size?: number | null
  font_datetime_weight?: number | null
  font_venue_family?: string | null
  font_venue_size?: number | null
  font_venue_weight?: number | null
  font_title_color?: string | null
  font_subtitle_color?: string | null
  font_datetime_color?: string | null
  font_venue_color?: string | null
  font_welcome_family?: string | null
  font_welcome_size?: number | null
  font_welcome_weight?: number | null
  font_welcome_color?: string | null
  venue_image_url?: string | null
  border_radius?: number | null
  card_shadow?: string | null
  button_style?: string | null
  background_image?: string | null
  background_overlay_opacity?: number | null
  font_heading?: string | null
  font_body?: string | null
  font_button?: string | null
  font_heading_size?: number | null
  font_body_size?: number | null
  font_heading_weight?: number | null
  font_body_weight?: number | null
  font_heading_spacing?: number | null
  font_body_spacing?: number | null
  font_heading_line_height?: number | null
  font_body_line_height?: number | null
}
