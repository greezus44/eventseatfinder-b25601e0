export interface FontOption {
  label: string;
  value: string;
  css: string;
}

export const GOOGLE_FONTS: FontOption[] = [
  { label: 'Inter', value: 'Inter', css: 'Inter:wght@300;400;500;600;700' },
  {
    label: 'Playfair Display',
    value: 'Playfair Display',
    css: 'Playfair+Display:wght@400;500;600;700',
  },
  {
    label: 'Cormorant Garamond',
    value: 'Cormorant Garamond',
    css: 'Cormorant+Garamond:wght@300;400;500;600;700',
  },
  {
    label: 'Montserrat',
    value: 'Montserrat',
    css: 'Montserrat:wght@300;400;500;600;700',
  },
  { label: 'Lora', value: 'Lora', css: 'Lora:wght@400;500;600;700' },
  {
    label: 'Merriweather',
    value: 'Merriweather',
    css: 'Merriweather:wght@300;400;700',
  },
  {
    label: 'Poppins',
    value: 'Poppins',
    css: 'Poppins:wght@300;400;500;600;700',
  },
  { label: 'Roboto', value: 'Roboto', css: 'Roboto:wght@300;400;500;700' },
  {
    label: 'Open Sans',
    value: 'Open Sans',
    css: 'Open+Sans:wght@300;400;500;600;700',
  },
  {
    label: 'Source Sans 3',
    value: 'Source Sans 3',
    css: 'Source+Sans+3:wght@300;400;500;600;700',
  },
  {
    label: 'Work Sans',
    value: 'Work Sans',
    css: 'Work+Sans:wght@300;400;500;600;700',
  },
  {
    label: 'DM Serif Display',
    value: 'DM Serif Display',
    css: 'DM+Serif+Display:wght@400',
  },
  {
    label: 'EB Garamond',
    value: 'EB Garamond',
    css: 'EB+Garamond:wght@400;500;600;700',
  },
  {
    label: 'Nunito Sans',
    value: 'Nunito Sans',
    css: 'Nunito+Sans:wght@300;400;600;700',
  },
  {
    label: 'Crimson Text',
    value: 'Crimson Text',
    css: 'Crimson+Text:wght@400;600;700',
  },
  {
    label: 'Josefin Sans',
    value: 'Josefin Sans',
    css: 'Josefin+Sans:wght@300;400;500;600;700',
  },
  { label: 'Karla', value: 'Karla', css: 'Karla:wght@300;400;500;700' },
  { label: 'Mulish', value: 'Mulish', css: 'Mulish:wght@300;400;500;600;700' },
  {
    label: 'Spectral',
    value: 'Spectral',
    css: 'Spectral:wght@300;400;500;600;700',
  },
  {
    label: 'Fraunces',
    value: 'Fraunces',
    css: 'Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700',
  },
];

export const FONT_WEIGHTS = [
  { label: 'Light 300', value: 300 },
  { label: 'Regular 400', value: 400 },
  { label: 'Medium 500', value: 500 },
  { label: 'SemiBold 600', value: 600 },
  { label: 'Bold 700', value: 700 },
];

export const FONT_SIZE_OPTIONS = [
  10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44,
  48, 52, 56, 60, 64, 72,
];

export function getFontLinkTag(): string {
  const families = GOOGLE_FONTS.map((f) => `family=${f.css}`).join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet" />`;
}

export function getFontCss(fontFamily: string): string {
  const font = GOOGLE_FONTS.find(
    (f) => f.value === fontFamily || f.label === fontFamily
  );
  if (!font) return '';
  return `@import url('https://fonts.googleapis.com/css2?family=${font.css}&display=swap');`;
}
