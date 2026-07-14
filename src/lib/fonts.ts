export interface FontOption { name: string; cssName: string }

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
  { name: 'Imperial Script', cssName: 'Imperial Script' },
  { name: 'Sans Serif', cssName: 'Sans Serif' },
]

export function getFontCss(name: string): string {
  const font = FONTS.find((f) => f.name === name)
  if (!font) return "'Inter', sans-serif"
  if (font.name === 'Sans Serif') return 'sans-serif'
  return `'${font.cssName}', sans-serif`
}

export function loadGoogleFonts(fontNames: string[]): void {
  const wanted = Array.from(new Set(fontNames.filter(Boolean)))
  if (wanted.length === 0) return
  const head = document.head
  const existing = new Set<string>()
  head.querySelectorAll<HTMLLinkElement>('link[data-google-font]').forEach((link) => {
    const family = link.getAttribute('data-google-font')
    if (family) existing.add(family)
  })
  for (const name of wanted) {
    if (existing.has(name)) continue
    const font = FONTS.find((f) => f.name === name)
    if (!font) continue
    if (name === 'Sans Serif') continue
    const cssName = font.cssName
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cssName).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-google-font', name)
    head.appendChild(link)
    existing.add(name)
  }
}

export function formatTime12(time: string | null | undefined): string {
  if (!time) return ''
  const match = /^(\d{2}):(\d{2})/.exec(time)
  if (!match) return ''
  let hour = parseInt(match[1], 10)
  const minute = match[2]
  const period = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${hour}:${minute} ${period}`
}
