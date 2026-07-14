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
  color_primary: '#1A1A1A',
  color_background: '#FAF3E8',
  logo_size: 64,
  radius: 12,
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
    color_footer: '#F8F8F8',
  },
  {
    name: 'Modern Black',
    color_primary: '#FFFFFF',
    color_secondary: '#DADADA',
    color_background: '#1A1A1A',
    color_button: '#FFFFFF',
    color_button_text: '#1A1A1A',
    color_link: '#FFFFFF',
    color_footer: '#0A0A0A',
  },
  {
    name: 'Minimal Grey',
    color_primary: '#1A1A1A',
    color_secondary: '#4A4A4A',
    color_background: '#EFEFEF',
    color_button: '#1A1A1A',
    color_button_text: '#FFFFFF',
    color_link: '#1A1A1A',
    color_footer: '#DADADA',
  },
  {
    name: 'Emerald',
    color_primary: '#047857',
    color_secondary: '#065F46',
    color_background: '#ECFDF5',
    color_button: '#047857',
    color_button_text: '#FFFFFF',
    color_link: '#047857',
    color_footer: '#D1FAE5',
  },
  {
    name: 'Royal Blue',
    color_primary: '#1E40AF',
    color_secondary: '#1E3A8A',
    color_background: '#EFF6FF',
    color_button: '#1E40AF',
    color_button_text: '#FFFFFF',
    color_link: '#1E40AF',
    color_footer: '#DBEAFE',
  },
  {
    name: 'Romantic Blush',
    color_primary: '#9F1239',
    color_secondary: '#881337',
    color_background: '#FFF1F2',
    color_button: '#9F1239',
    color_button_text: '#FFFFFF',
    color_link: '#9F1239',
    color_footer: '#FFE4E6',
  },
];

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Source Serif Pro', value: 'Source Serif Pro' },
  { label: 'EB Garamond', value: 'EB Garamond' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Work Sans', value: 'Work Sans' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
];
