export interface ScheduleItem {
  time: string;
  label: string;
}

export interface GuestPageSettings {
  id: string;
  event_id: string;
  venue_image_url: string | null;
  cover_image: string | null;
  logo_url: string | null;
  logo_size: number;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_button: string;
  color_button_text: string;
  color_link: string;
  color_footer: string;
  font_heading: string;
  font_body: string;
  radius: number;
  schedule_items: ScheduleItem[];
  created_at: string;
  updated_at: string;
}

export interface GuestPageSettingsInput {
  event_id: string;
  venue_image_url?: string | null;
  cover_image?: string | null;
  logo_url?: string | null;
  logo_size?: number;
  color_primary?: string;
  color_secondary?: string;
  color_background?: string;
  color_button?: string;
  color_button_text?: string;
  color_link?: string;
  color_footer?: string;
  font_heading?: string;
  font_body?: string;
  radius?: number;
  schedule_items?: ScheduleItem[];
}

export interface ThemePreset {
  name: string;
  color_primary: string;
  color_secondary: string;
  color_background: string;
  color_button: string;
  color_button_text: string;
  color_link: string;
  color_footer: string;
}

export interface FontOption {
  label: string;
  value: string;
}

export const DEFAULT_SETTINGS: GuestPageSettingsInput = {
  event_id: '',
  venue_image_url: null,
  cover_image: null,
  logo_url: null,
  logo_size: 64,
  color_primary: '#1A1A1A',
  color_secondary: '#4A4A4A',
  color_background: '#FAF3E8',
  color_button: '#1A1A1A',
  color_button_text: '#FFFFFF',
  color_link: '#1A1A1A',
  color_footer: '#1A1A1A',
  font_heading: 'Inter',
  font_body: 'Inter',
  radius: 12,
  schedule_items: [],
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Elegant White',
    color_primary: '#1A1A1A',
    color_secondary: '#4A4A4A',
    color_background: '#FFFFFF',
    color_button: '#1A1A1A',
    color_button_text: '#FFFFFF',
    color_link: '#1A1A1A',
    color_footer: '#1A1A1A',
  },
  {
    name: 'Modern Black',
    color_primary: '#FFFFFF',
    color_secondary: '#DADADA',
    color_background: '#1A1A1A',
    color_button: '#FFFFFF',
    color_button_text: '#1A1A1A',
    color_link: '#FFFFFF',
    color_footer: '#FFFFFF',
  },
  {
    name: 'Minimal Grey',
    color_primary: '#1A1A1A',
    color_secondary: '#4A4A4A',
    color_background: '#EFEFEF',
    color_button: '#1A1A1A',
    color_button_text: '#FFFFFF',
    color_link: '#1A1A1A',
    color_footer: '#4A4A4A',
  },
  {
    name: 'Emerald',
    color_primary: '#064E3B',
    color_secondary: '#047857',
    color_background: '#ECFDF5',
    color_button: '#064E3B',
    color_button_text: '#FFFFFF',
    color_link: '#064E3B',
    color_footer: '#064E3B',
  },
  {
    name: 'Royal Blue',
    color_primary: '#1E3A8A',
    color_secondary: '#2563EB',
    color_background: '#EFF6FF',
    color_button: '#1E3A8A',
    color_button_text: '#FFFFFF',
    color_link: '#1E3A8A',
    color_footer: '#1E3A8A',
  },
  {
    name: 'Romantic Blush',
    color_primary: '#9F1239',
    color_secondary: '#BE123C',
    color_background: '#FFF1F2',
    color_button: '#9F1239',
    color_button_text: '#FFFFFF',
    color_link: '#9F1239',
    color_footer: '#9F1239',
  },
];

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Source Sans 3', value: 'Source Sans 3' },
  { label: 'Work Sans', value: 'Work Sans' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Outfit', value: 'Outfit' },
  { label: 'Space Grotesk', value: 'Space Grotesk' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Cormorant', value: 'Cormorant' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
];
