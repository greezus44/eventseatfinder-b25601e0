export interface GuestPageSettings {
  id: string;
  event_id: string;
  logo_url: string | null;
  logo_size: number;
  logo_rounded: boolean;
  logo_position: string;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_card: string;
  color_text: string;
  color_header: string;
  color_button: string;
  color_button_text: string;
  color_link: string;
  color_footer: string;
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
  background_overlay_opacity: number;
  background_image: string | null;
  cover_image: string | null;
  banner_height: number;
  welcome_message: string | null;
  event_subtitle: string | null;
  card_shadow: string;
  button_style: string;
  venue_image_url: string | null;
  enable_schedule: boolean;
  enable_gallery: boolean;
  schedule_items: unknown[] | null;
  gallery_images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface GuestPageSettingsInput {
  logo_url?: string | null;
  logo_size?: number;
  logo_rounded?: boolean;
  logo_position?: string;
  color_primary?: string;
  color_secondary?: string;
  color_background?: string;
  color_card?: string;
  color_text?: string;
  color_header?: string;
  color_button?: string;
  color_button_text?: string;
  color_link?: string;
  color_footer?: string;
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
  background_overlay_opacity?: number;
  background_image?: string | null;
  cover_image?: string | null;
  banner_height?: number;
  welcome_message?: string | null;
  event_subtitle?: string | null;
  card_shadow?: string;
  button_style?: string;
  venue_image_url?: string | null;
  enable_schedule?: boolean;
  enable_gallery?: boolean;
  schedule_items?: unknown[];
  gallery_images?: string[];
}

export const DEFAULT_SETTINGS: GuestPageSettingsInput = {
  logo_url: null, logo_size: 80, logo_rounded: false, logo_position: 'center',
  color_primary: '#1A1A1A', color_secondary: '#4A4A4A', color_background: '#F8F8F8',
  color_card: '#FFFFFF', color_text: '#1A1A1A', color_header: '#FFFFFF',
  color_button: '#1A1A1A', color_button_text: '#FFFFFF', color_link: '#1A1A1A',
  color_footer: '#1A1A1A', font_heading: 'Inter', font_body: 'Inter', font_button: 'Inter',
  font_heading_size: 48, font_body_size: 16, font_heading_weight: 700, font_body_weight: 400,
  font_heading_spacing: 0, font_body_spacing: 0, font_heading_line_height: 1.2, font_body_line_height: 1.5,
  border_radius: 16, background_overlay_opacity: 0, background_image: null, cover_image: null,
  banner_height: 400, welcome_message: null, event_subtitle: null, card_shadow: 'md',
  button_style: 'filled', venue_image_url: null, enable_schedule: false, enable_gallery: false,
  schedule_items: [], gallery_images: [],
};

export interface ThemePreset {
  name: string;
  color_primary: string;
  color_background: string;
  color_card: string;
  color_text: string;
  color_button: string;
  color_button_text: string;
  color_link: string;
  color_footer: string;
  font_heading: string;
  font_body: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Elegant White',
    color_primary: '#1A1A1A', color_background: '#FFFFFF', color_card: '#F8F8F8',
    color_text: '#1A1A1A', color_button: '#1A1A1A', color_button_text: '#FFFFFF',
    color_link: '#1A1A1A', color_footer: '#1A1A1A',
    font_heading: 'Inter', font_body: 'Inter',
  },
  {
    name: 'Modern Black',
    color_primary: '#EFEFEF', color_background: '#0A0A0A', color_card: '#1A1A1A',
    color_text: '#F8F8F8', color_button: '#EFEFEF', color_button_text: '#0A0A0A',
    color_link: '#EFEFEF', color_footer: '#0A0A0A',
    font_heading: 'Inter', font_body: 'Inter',
  },
  {
    name: 'Minimal Grey',
    color_primary: '#4A4A4A', color_background: '#F8F8F8', color_card: '#FFFFFF',
    color_text: '#1A1A1A', color_button: '#4A4A4A', color_button_text: '#FFFFFF',
    color_link: '#4A4A4A', color_footer: '#1A1A1A',
    font_heading: 'Inter', font_body: 'Inter',
  },
  {
    name: 'Emerald',
    color_primary: '#059669', color_background: '#F0FDFA', color_card: '#FFFFFF',
    color_text: '#064E3B', color_button: '#059669', color_button_text: '#FFFFFF',
    color_link: '#059669', color_footer: '#064E3B',
    font_heading: 'Inter', font_body: 'Inter',
  },
  {
    name: 'Royal Blue',
    color_primary: '#2563EB', color_background: '#EFF6FF', color_card: '#FFFFFF',
    color_text: '#1E3A8A', color_button: '#2563EB', color_button_text: '#FFFFFF',
    color_link: '#2563EB', color_footer: '#1E3A8A',
    font_heading: 'Inter', font_body: 'Inter',
  },
  {
    name: 'Romantic Blush',
    color_primary: '#BE185D', color_background: '#FDF2F8', color_card: '#FFFFFF',
    color_text: '#831843', color_button: '#BE185D', color_button_text: '#FFFFFF',
    color_link: '#BE185D', color_footer: '#831843',
    font_heading: 'Inter', font_body: 'Inter',
  },
];

export const FONT_OPTIONS = [
  'Inter', 'Playfair Display', 'Cormorant Garamond', 'Montserrat', 'Lora',
  'Merriweather', 'Source Sans 3', 'Raleway', 'Cinzel', 'EB Garamond',
  'Nunito Sans', 'Bitter', 'DM Serif Display', 'Karla', 'Work Sans',
  'Manrope', 'Outfit', 'Libre Baskerville',
];
