export interface FontOption {
  name: string;
  cssName: string;
}

export const GOOGLE_FONTS: FontOption[] = [
  { name: 'Inter', cssName: 'Inter' },
  { name: 'Roboto', cssName: 'Roboto' },
  { name: 'Open Sans', cssName: 'Open Sans' },
  { name: 'Lato', cssName: 'Lato' },
  { name: 'Montserrat', cssName: 'Montserrat' },
  { name: 'Poppins', cssName: 'Poppins' },
  { name: 'Playfair Display', cssName: 'Playfair Display' },
  { name: 'Merriweather', cssName: 'Merriweather' },
  { name: 'Lora', cssName: 'Lora' },
  { name: 'Nunito', cssName: 'Nunito' },
  { name: 'Raleway', cssName: 'Raleway' },
  { name: 'Oswald', cssName: 'Oswald' },
  { name: 'Cormorant Garamond', cssName: 'Cormorant Garamond' },
  { name: 'Dancing Script', cssName: 'Dancing Script' },
  { name: 'Bebas Neue', cssName: 'Bebas Neue' },
  { name: 'Quicksand', cssName: 'Quicksand' },
  { name: 'PT Serif', cssName: 'PT Serif' },
  { name: 'Work Sans', cssName: 'Work Sans' },
  { name: 'DM Serif Display', cssName: 'DM Serif Display' },
  { name: 'Cinzel', cssName: 'Cinzel' },
];

export const FONT_WEIGHTS: number[] = [300, 400, 500, 600, 700];

export const FONT_SIZE_OPTIONS: number[] = [
  10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36,
  40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
];

export function getFontCss(fontFamily: string | null | undefined): string {
  if (!fontFamily) return "'Inter', sans-serif";
  const font = GOOGLE_FONTS.find(
    (f) => f.name === fontFamily || f.cssName === fontFamily,
  );
  if (font) {
    return `'${font.cssName}', sans-serif`;
  }
  return `'${fontFamily}', sans-serif`;
}

export function getFontSize(size: number | null | undefined): string {
  if (size == null || isNaN(size)) return '16px';
  return `${size}px`;
}

export function getFontWeight(weight: number | null | undefined): string {
  if (weight == null || isNaN(weight)) return '400';
  return String(weight);
}
