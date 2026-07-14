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

export const DEFAULT_SETTINGS: GuestPageSettingsInput = {
  event_id: '',
  venue_image_url: null,
  cover_image: null,
  logo_url: null,
  color_primary: '#1A1A1A',
  color_secondary: '#4A4A4A',
  color_background: '#FAF3E8',
  color_button: '#1A1A1A',
  color_button_text: '#FFFFFF',
  color_link: '#1A1A1A',
  color_footer: '#1A1A1A',
  font_heading: 'Inter',
  font_body: 'Inter',
  radius: 8,
  schedule_items: [],
};

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
    color_primary: '#4A4A4A',
    color_secondary: '#7A7A7A',
    color_background: '#EFEFEF',
    color_button: '#4A4A4A',
    color_button_text: '#FFFFFF',
    color_link: '#4A4A4A',
    color_footer: '#DADADA',
  },
  {
    name: 'Emerald',
    color_primary: '#047857',
    color_secondary: '#34D399',
    color_background: '#ECFDF5',
    color_button: '#047857',
    color_button_text: '#FFFFFF',
    color_link: '#047857',
    color_footer: '#064E3B',
  },
  {
    name: 'Royal Blue',
    color_primary: '#1E40AF',
    color_secondary: '#60A5FA',
    color_background: '#EFF6FF',
    color_button: '#1E40AF',
    color_button_text: '#FFFFFF',
    color_link: '#1E40AF',
    color_footer: '#1E3A8A',
  },
  {
    name: 'Romantic Blush',
    color_primary: '#9F1239',
    color_secondary: '#FB7185',
    color_background: '#FFF1F2',
    color_button: '#9F1239',
    color_button_text: '#FFFFFF',
    color_link: '#9F1239',
    color_footer: '#881337',
  },
];

export interface FontOption {
  label: string;
  value: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Source Serif Pro', value: 'Source Serif Pro' },
  { label: 'EB Garamond', value: 'EB Garamond' },
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
  { label: 'Work Sans', value: 'Work Sans' },
  { label: 'DM Sans', value: 'DM Sans' },
];
