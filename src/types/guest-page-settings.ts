export interface GuestPageSettings {
  id: string;
  event_id: string;
  logo_url: string | null;
  logo_size: number;
  logo_position: 'left' | 'center' | 'right';
  logo_rounded: boolean;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_card: string;
  color_button: string;
  color_button_text: string;
  color_header: string;
  color_footer: string;
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
  card_shadow: 'none' | 'sm' | 'md' | 'lg';
  button_style: 'filled' | 'outlined' | 'rounded';
  background_image: string | null;
  background_overlay_opacity: number;
  cover_image: string | null;
  banner_height: number;
  welcome_message: string | null;
  event_subtitle: string | null;
  enable_schedule: boolean;
  enable_gallery: boolean;
  schedule_items: { time: string; title: string; description: string }[] | null;
  gallery_images: string[] | null;
  venue_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type GuestPageSettingsInput = Omit<
  GuestPageSettings,
  'id' | 'event_id' | 'created_at' | 'updated_at'
>;

export const DEFAULT_SETTINGS: GuestPageSettingsInput = {
  logo_url: null,
  logo_size: 64,
  logo_position: 'center',
  logo_rounded: true,
  color_primary: '#0d9488',
  color_secondary: '#14b8a6',
  color_background: '#f8fafc',
  color_card: '#ffffff',
  color_button: '#0d9488',
  color_button_text: '#ffffff',
  color_header: '#0f172a',
  color_footer: '#475569',
  color_text: '#1e293b',
  color_link: '#0d9488',
  font_heading: 'Inter',
  font_body: 'Inter',
  font_button: 'Inter',
  font_heading_size: 32,
  font_body_size: 16,
  font_heading_weight: 700,
  font_body_weight: 400,
  font_heading_spacing: 0,
  font_body_spacing: 0,
  font_heading_line_height: 1.2,
  font_body_line_height: 1.5,
  border_radius: 12,
  card_shadow: 'md',
  button_style: 'filled',
  background_image: null,
  background_overlay_opacity: 0,
  cover_image: null,
  banner_height: 240,
  welcome_message: null,
  event_subtitle: null,
  enable_schedule: false,
  enable_gallery: false,
  schedule_items: null,
  gallery_images: null,
  venue_image_url: null,
};

export const FONT_OPTIONS: string[] = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Playfair Display',
  'Merriweather',
  'Nunito Sans',
  'Oswald',
  'Raleway',
  'Source Sans 3',
  'Work Sans',
  'DM Sans',
  'Manrope',
  'Space Grotesk',
  'Outfit',
  'Plus Jakarta Sans',
];

export const COLOR_PRESETS: { name: string; colors: Record<string, string> }[] =
  [
    {
      name: 'Teal',
      colors: {
        color_primary: '#0d9488',
        color_secondary: '#14b8a6',
        color_background: '#f0fdfa',
        color_card: '#ffffff',
        color_button: '#0d9488',
        color_button_text: '#ffffff',
        color_header: '#0f172a',
        color_text: '#1e293b',
        color_link: '#0d9488',
      },
    },
    {
      name: 'Royal Purple',
      colors: {
        color_primary: '#7c3aed',
        color_secondary: '#a78bfa',
        color_background: '#faf5ff',
        color_card: '#ffffff',
        color_button: '#7c3aed',
        color_button_text: '#ffffff',
        color_header: '#1e1b4b',
        color_text: '#312e81',
        color_link: '#7c3aed',
      },
    },
    {
      name: 'Rose Gold',
      colors: {
        color_primary: '#e11d48',
        color_secondary: '#fb7185',
        color_background: '#fff1f2',
        color_card: '#ffffff',
        color_button: '#e11d48',
        color_button_text: '#ffffff',
        color_header: '#4c0519',
        color_text: '#881337',
        color_link: '#e11d48',
      },
    },
    {
      name: 'Ocean Blue',
      colors: {
        color_primary: '#2563eb',
        color_secondary: '#60a5fa',
        color_background: '#eff6ff',
        color_card: '#ffffff',
        color_button: '#2563eb',
        color_button_text: '#ffffff',
        color_header: '#172554',
        color_text: '#1e3a8a',
        color_link: '#2563eb',
      },
    },
    {
      name: 'Emerald',
      colors: {
        color_primary: '#059669',
        color_secondary: '#34d399',
        color_background: '#ecfdf5',
        color_card: '#ffffff',
        color_button: '#059669',
        color_button_text: '#ffffff',
        color_header: '#022c22',
        color_text: '#064e3b',
        color_link: '#059669',
      },
    },
    {
      name: 'Sunset Orange',
      colors: {
        color_primary: '#ea580c',
        color_secondary: '#fb923c',
        color_background: '#fff7ed',
        color_card: '#ffffff',
        color_button: '#ea580c',
        color_button_text: '#ffffff',
        color_header: '#431407',
        color_text: '#7c2d12',
        color_link: '#ea580c',
      },
    },
    {
      name: 'Midnight',
      colors: {
        color_primary: '#6366f1',
        color_secondary: '#818cf8',
        color_background: '#0f172a',
        color_card: '#1e293b',
        color_button: '#6366f1',
        color_button_text: '#ffffff',
        color_header: '#f8fafc',
        color_text: '#e2e8f0',
        color_link: '#818cf8',
      },
    },
    {
      name: 'Classic Black & White',
      colors: {
        color_primary: '#18181b',
        color_secondary: '#3f3f46',
        color_background: '#ffffff',
        color_card: '#ffffff',
        color_button: '#18181b',
        color_button_text: '#ffffff',
        color_header: '#18181b',
        color_text: '#27272a',
        color_link: '#18181b',
      },
    },
  ];
