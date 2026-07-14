export type Guest = {
  id: string
  name: string
  table_id: string | null
  created_at: string
}

export type Table = {
  id: string
  name: string
  capacity: number
  created_at: string
}

export type Event = {
  id: string
  name: string
  date: string | null
  time: string | null
  venue: string | null
  venue_layout_url: string | null
  logo_url: string | null
  logo_size: number
  title_text: string
  title_size: number
  title_color: string
  subtitle_text: string
  subtitle_size: number
  subtitle_color: string
  datetime_size: number
  datetime_color: string
  venue_text_size: number
  venue_text_color: string
  background_color: string
  accent_color: string
  text_color: string
  created_at: string
}

export type GuestPageSettings = {
  id: string
  event_id: string
  show_venue_layout: boolean
  show_find_seat: boolean
  created_at: string
}
