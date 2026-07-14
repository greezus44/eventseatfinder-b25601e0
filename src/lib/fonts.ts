export interface FontOption {
  name: string
  cssName: string
}

export const FONTS: FontOption[] = [
  { name: 'Inter', cssName: 'Inter' },
  { name: 'Playfair Display', cssName: 'Playfair Display' },
  { name: 'Montserrat', cssName: 'Montserrat' },
  { name: 'Lora', cssName: 'Lora' },
  { name: 'Cormorant Garamond', cssName: 'Cormorant Garamond' },
  { name: 'Poppins', cssName: 'Poppins' },
  { name: 'Crimson Text', cssName: 'Crimson Text' },
  { name: 'Raleway', cssName: 'Raleway' },
  { name: 'Source Sans 3', cssName: 'Source Sans 3' },
  { name: 'Nunito Sans', cssName: 'Nunito Sans' },
  { name: 'Work Sans', cssName: 'Work Sans' },
  { name: 'DM Serif Display', cssName: 'DM Serif Display' },
  { name: 'EB Garamond', cssName: 'EB Garamond' },
  { name: 'Josefin Sans', cssName: 'Josefin Sans' },
  { name: 'Libre Baskerville', cssName: 'Libre Baskerville' },
  { name: 'Quicksand', cssName: 'Quicksand' },
  { name: 'Karla', cssName: 'Karla' },
  { name: 'Mulish', cssName: 'Mulish' },
  { name: 'Fraunces', cssName: 'Fraunces' },
  { name: 'Spectral', cssName: 'Spectral' },
]

export const FONT_SIZE_OPTIONS = [
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
]

export function getFontCss(name: string | null | undefined): string {
  if (!name) return 'Inter, sans-serif'
  const font = FONTS.find((f) => f.name === name || f.cssName === name)
  return font ? `'${font.cssName}', sans-serif` : `'${name}', sans-serif`
}

export function getFontSize(size: number | null | undefined): string {
  return `${size ?? 16}px`
}

export function loadGoogleFonts(fontNames: string[]): void {
  const unique = [...new Set(fontNames.filter(Boolean))]
  if (unique.length === 0) return

  const families = unique
    .map((name) => {
      const font = FONTS.find((f) => f.name === name || f.cssName === name)
      const cssName = font?.cssName ?? name
      return `${cssName.replace(/ /g, '+')}:wght@300;400;500;600;700`
    })
    .join('&family=')

  const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
