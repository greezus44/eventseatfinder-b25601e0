export interface Event {
  id: string; user_id: string; name: string; slug: string
  date: string | null; time: string | null; venue: string | null; created_at: string
}
export interface EventInput { name: string; slug: string; date?: string | null; time?: string | null; venue?: string | null }
export interface Guest { id: string; event_id: string; name: string; table_id: string | null; created_at: string }
export interface GuestInput { event_id: string; name: string; table_id?: string | null }
export interface Table { id: string; event_id: string; name: string; number: number; capacity: number; created_at: string }
export interface TableInput { event_id: string; name: string; number: number; capacity: number }
export interface GuestPageSettings {
  id: string; event_id: string; event_subtitle: string | null; logo_url: string | null
  logo_size: number; logo_rounded: boolean; venue_image_url: string | null
  color_primary: string | null; color_background: string | null; color_card: string | null
  color_text: string | null; color_header: string | null; border_radius: number | null
  font_title_family: string | null; font_title_size: number | null; font_title_color: string | null
  font_subtitle_family: string | null; font_subtitle_size: number | null; font_subtitle_color: string | null
  font_datetime_family: string | null; font_datetime_size: number | null; font_datetime_color: string | null
  font_venue_family: string | null; font_venue_size: number | null; font_venue_color: string | null
  font_welcome_family: string | null; font_welcome_size: number | null; font_welcome_color: string | null
  created_at: string; updated_at: string; events?: Event
}
export interface GuestPageSettingsInput {
  event_id: string; event_subtitle?: string | null; logo_url?: string | null; logo_size?: number
  logo_rounded?: boolean; venue_image_url?: string | null; color_primary?: string | null
  color_background?: string | null; color_card?: string | null; color_text?: string | null
  color_header?: string | null; border_radius?: number | null
  font_title_family?: string | null; font_title_size?: number | null; font_title_color?: string | null
  font_subtitle_family?: string | null; font_subtitle_size?: number | null; font_subtitle_color?: string | null
  font_datetime_family?: string | null; font_datetime_size?: number | null; font_datetime_color?: string | null
  font_venue_family?: string | null; font_venue_size?: number | null; font_venue_color?: string | null
  font_welcome_family?: string | null; font_welcome_size?: number | null; font_welcome_color?: string | null
}
