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
  color_footer: '#0f172a', font_heading: 'Inter', font_body: 'Inter', font_button: 'Inter',
  font_heading_size: 48, font_body_size: 16, font_heading_weight: 700, font_body_weight: 400,
  font_heading_spacing: 0, font_body_spacing: 0, font_heading_line_height: 1.2, font_body_line_height: 1.5,
  border_radius: 16, background_overlay_opacity: 0, background_image: null, cover_image: null,
  banner_height: 400, welcome_message: null, event_subtitle: null, card_shadow: 'md',
  button_style: 'filled', venue_image_url: null, enable_schedule: false, enable_gallery: false,
  schedule_items: [], gallery_images: [],
};

export const FONT_OPTIONS = [
  'Inter', 'Playfair Display', 'Cormorant Garamond', 'Montserrat', 'Lora',
  'Merriweather', 'Source Sans 3', 'Raleway', 'Cinzel', 'EB Garamond',
  'Nunito Sans', 'Bitter', 'DM Serif Display', 'Karla', 'Work Sans',
  'Manrope', 'Outfit', 'Libre Baskerville',
];

export const COLOR_PRESETS = [
  { name: 'Teal', primary: '#0f766e', secondary: '#115e59', background: '#f8fafc', footer: '#0f172a' },
  { name: 'Navy', primary: '#1e3a8a', secondary: '#1e40af', background: '#f8fafc', footer: '#0f172a' },
  { name: 'Rose', primary: '#be123c', secondary: '#9f1239', background: '#fff1f2', footer: '#4c0519' },
  { name: 'Forest', primary: '#166534', secondary: '#14532d', background: '#f0fdf4', footer: '#052e16' },
  { name: 'Amber', primary: '#b45309', secondary: '#92400e', background: '#fffbeb', footer: '#451a03' },
  { name: 'Slate', primary: '#334155', secondary: '#1e293b', background: '#f8fafc', footer: '#0f172a' },
  { name: 'Plum', primary: '#7e22ce', secondary: '#6b21a8', background: '#faf5ff', footer: '#3b0764' },
  { name: 'Ocean', primary: '#0369a1', secondary: '#075985', background: '#f0f9ff', footer: '#082f49' },
];
