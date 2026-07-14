export interface GuestPageSettings {
  id: string;
  event_id: string;
  // Branding
  logo_url: string | null;
  logo_size: number;
  logo_position: 'left' | 'center' | 'right';
  logo_rounded: boolean;
  // Colours
  color_primary: string;
  color_background: string;
  color_card: string;
  color_button: string;
  color_button_text: string;
  color_header: string;
  color_text: string;
  color_link: string;
  // Typography
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
  // Appearance
  border_radius: number;
  card_shadow: 'none' | 'sm' | 'md' | 'lg';
  button_style: 'filled' | 'outlined' | 'rounded';
  background_image: string | null;
  background_overlay_opacity: number;
  // Venue layout
  venue_image_url: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type GuestPageSettingsInput = Omit<
  GuestPageSettings,
  'id' | 'event_id' | 'created_at' | 'updated_at'
>;

export const DEFAULT_SETTINGS: GuestPageSettingsInput = {
  logo_url: null,
  logo_size: 80,
  logo_position: 'center',
  logo_rounded: false,
  color_primary: '#0f766e',
  color_background: '#f8fafc',
  color_card: '#ffffff',
  color_button: '#0f766e',
  color_button_text: '#ffffff',
  color_header: '#ffffff',
  color_text: '#0f172a',
  color_link: '#0f766e',
  font_heading: 'Inter',
  font_body: 'Inter',
  font_button: 'Inter',
  font_heading_size: 48,
  font_body_size: 16,
  font_heading_weight: 700,
  font_body_weight: 400,
  font_heading_spacing: 0,
  font_body_spacing: 0,
  font_heading_line_height: 1.2,
  font_body_line_height: 1.5,
  border_radius: 16,
  card_shadow: 'md',
  button_style: 'filled',
  background_image: null,
  background_overlay_opacity: 0,
  venue_image_url: null,
};

export const FONT_OPTIONS = [
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
        color_primary: '#0f766e',
        color_background: '#f8fafc',
        color_card: '#ffffff',
        color_button: '#0f766e',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#0f172a',
        color_link: '#0f766e',
      },
    },
    {
      name: 'Royal Blue',
      colors: {
        color_primary: '#2563eb',
        color_background: '#f0f4ff',
        color_card: '#ffffff',
        color_button: '#2563eb',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#0f172a',
        color_link: '#2563eb',
      },
    },
    {
      name: 'Rose Gold',
      colors: {
        color_primary: '#be185d',
        color_background: '#fdf2f8',
        color_card: '#ffffff',
        color_button: '#be185d',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#1c1917',
        color_link: '#be185d',
      },
    },
    {
      name: 'Forest',
      colors: {
        color_primary: '#15803d',
        color_background: '#f0fdf4',
        color_card: '#ffffff',
        color_button: '#15803d',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#14532d',
        color_link: '#15803d',
      },
    },
    {
      name: 'Midnight',
      colors: {
        color_primary: '#6366f1',
        color_background: '#0f172a',
        color_card: '#1e293b',
        color_button: '#6366f1',
        color_button_text: '#ffffff',
        color_header: '#1e293b',
        color_text: '#e2e8f0',
        color_link: '#818cf8',
      },
    },
    {
      name: 'Sunset',
      colors: {
        color_primary: '#ea580c',
        color_background: '#fff7ed',
        color_card: '#ffffff',
        color_button: '#ea580c',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#1c1917',
        color_link: '#ea580c',
      },
    },
    {
      name: 'Slate',
      colors: {
        color_primary: '#334155',
        color_background: '#f8fafc',
        color_card: '#ffffff',
        color_button: '#334155',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#0f172a',
        color_link: '#334155',
      },
    },
    {
      name: 'Plum',
      colors: {
        color_primary: '#7c3aed',
        color_background: '#faf5ff',
        color_card: '#ffffff',
        color_button: '#7c3aed',
        color_button_text: '#ffffff',
        color_header: '#ffffff',
        color_text: '#1e1b4b',
        color_link: '#7c3aed',
      },
    },
  ];
