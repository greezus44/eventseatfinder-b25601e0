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

export const FONT_WEIGHTS: number[] = [
  100, 200, 300, 400, 500, 600, 700, 800, 900,
];

export const FONT_SIZE_OPTIONS: number[] = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96,
];

/**
 * Returns a <link> tag string for loading the given Google Fonts.
 * De-duplicates font names.
 */
export function getFontLinkTag(fontFamilies: string[]): string {
  const unique = Array.from(
    new Set(
      fontFamilies.filter(
        (f) => f && GOOGLE_FONTS.some((gf) => gf.name === f)
      )
    )
  );
  if (unique.length === 0) return '';
  const families = unique
    .map((f) => {
      const cssName = GOOGLE_FONTS.find((gf) => gf.name === f)?.cssName ?? f;
      return `family=${cssName.replace(/ /g, '+')}:wght@300;400;500;600;700;800`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Returns a CSS font-family declaration string for the given font name.
 */
export function getFontCss(fontFamily: string | null | undefined): string {
  if (!fontFamily) return "'Inter', sans-serif";
  const cssName =
    GOOGLE_FONTS.find((gf) => gf.name === fontFamily)?.cssName ?? fontFamily;
  return `'${cssName}', sans-serif`;
}

/**
 * Returns a CSS font-size string (e.g. "32px") or a fallback.
 */
export function getFontSize(size: number | null | undefined): string {
  return size ? `${size}px` : '16px';
}

/**
 * Returns a CSS font-weight string or a fallback.
 */
export function getFontWeight(weight: number | null | undefined): string {
  return weight ? String(weight) : '400';
}
