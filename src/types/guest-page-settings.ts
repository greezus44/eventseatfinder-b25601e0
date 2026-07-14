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
  color_primary: '#0f766e', color_secondary: '#115e59', color_background: '#f8fafc',
  color_card: '#ffffff', color_text: '#0f172a', color_header: '#ffffff',
  color_button: '#0f766e', color_button_text: '#ffffff', color_link: '#0f766e',
  color_footer: '#0f172a', font_heading: 'Playfair Display', font_body: 'Inter', font_button: 'Inter',
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
    color_primary: '#0f766e', color_background: '#ffffff', color_card: '#f8fafc',
    color_text: '#1e293b', color_button: '#0f766e', color_button_text: '#ffffff',
    color_link: '#0f766e', color_footer: '#1e293b',
    font_heading: 'Playfair Display', font_body: 'Inter',
  },
  {
    name: 'Modern Black',
    color_primary: '#f59e0b', color_background: '#0a0a0a', color_card: '#1a1a1a',
    color_text: '#f5f5f5', color_button: '#f59e0b', color_button_text: '#0a0a0a',
    color_link: '#f59e0b', color_footer: '#0a0a0a',
    font_heading: 'Outfit', font_body: 'Inter',
  },
  {
    name: 'Minimal Grey',
    color_primary: '#475569', color_background: '#f1f5f9', color_card: '#ffffff',
    color_text: '#1e293b', color_button: '#475569', color_button_text: '#ffffff',
    color_link: '#475569', color_footer: '#1e293b',
    font_heading: 'Inter', font_body: 'Inter',
  },
  {
    name: 'Emerald',
    color_primary: '#059669', color_background: '#f0fdf4', color_card: '#ffffff',
    color_text: '#064e3b', color_button: '#059669', color_button_text: '#ffffff',
    color_link: '#059669', color_footer: '#064e3b',
    font_heading: 'Cormorant Garamond', font_body: 'Inter',
  },
  {
    name: 'Royal Blue',
    color_primary: '#2563eb', color_background: '#eff6ff', color_card: '#ffffff',
    color_text: '#1e3a8a', color_button: '#2563eb', color_button_text: '#ffffff',
    color_link: '#2563eb', color_footer: '#1e3a8a',
    font_heading: 'Montserrat', font_body: 'Source Sans 3',
  },
  {
    name: 'Romantic Blush',
    color_primary: '#be185d', color_background: '#fdf2f8', color_card: '#ffffff',
    color_text: '#831843', color_button: '#be185d', color_button_text: '#ffffff',
    color_link: '#be185d', color_footer: '#831843',
    font_heading: 'Cormorant Garamond', font_body: 'Lora',
  },
];

export const FONT_OPTIONS = [
  'Inter', 'Playfair Display', 'Cormorant Garamond', 'Montserrat', 'Lora',
  'Merriweather', 'Source Sans 3', 'Raleway', 'Cinzel', 'EB Garamond',
  'Nunito Sans', 'Bitter', 'DM Serif Display', 'Karla', 'Work Sans',
  'Manrope', 'Outfit', 'Libre Baskerville',
];
