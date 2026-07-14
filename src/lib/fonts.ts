export interface FontOption {
  name: string
  googleName?: string
}

export const FONTS: FontOption[] = [
  { name: 'Inter' },
  { name: 'Playfair Display', googleName: 'Playfair+Display' },
  { name: 'Cormorant Garamond', googleName: 'Cormorant+Garamond' },
  { name: 'Lato', googleName: 'Lato' },
  { name: 'Montserrat', googleName: 'Montserrat' },
  { name: 'Raleway', googleName: 'Raleway' },
  { name: 'Josefin Sans', googleName: 'Josefin+Sans' },
  { name: 'EB Garamond', googleName: 'EB+Garamond' },
  { name: 'Libre Baskerville', googleName: 'Libre+Baskerville' },
  { name: 'Merriweather', googleName: 'Merriweather' },
  { name: 'Nunito', googleName: 'Nunito' },
  { name: 'Open Sans', googleName: 'Open+Sans' },
  { name: 'Poppins', googleName: 'Poppins' },
  { name: 'Roboto', googleName: 'Roboto' },
  { name: 'Source Serif 4', googleName: 'Source+Serif+4' },
  { name: 'Spectral', googleName: 'Spectral' },
  { name: 'Crimson Text', googleName: 'Crimson+Text' },
  { name: 'Cinzel', googleName: 'Cinzel' },
  { name: 'Great Vibes', googleName: 'Great+Vibes' },
  { name: 'Sacramento', googleName: 'Sacramento' },
  { name: 'Dancing Script', googleName: 'Dancing+Script' },
  { name: 'Pacifico', googleName: 'Pacifico' },
  { name: 'Satisfy', googleName: 'Satisfy' },
]

export function getFontCss(name: string): string {
  return `"${name}", system-ui, -apple-system, sans-serif`
}

const loadedFonts = new Set<string>()
export function loadGoogleFonts(names: string[]): void {
  const toLoad = names.filter((n) => {
    const font = FONTS.find((f) => f.name === n)
    return font?.googleName && !loadedFonts.has(n)
  })
  if (toLoad.length === 0) return
  toLoad.forEach((n) => loadedFonts.add(n))
  const families = toLoad
    .map((n) => FONTS.find((f) => f.name === n)?.googleName)
    .filter(Boolean)
    .map((g) => `family=${g}:ital,wght@0,400;0,600;0,700;1,400`)
    .join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}

export function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}
