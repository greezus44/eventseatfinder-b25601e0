export interface FontOption {
  name: string;
  cssName: string;
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
]

export function getFontCss(name: string | null | undefined): string {
  if (!name) return 'Inter, sans-serif'
  const font = FONTS.find((f) => f.name === name)
  if (!font) return `${name}, sans-serif`
  const fallback = font.cssName.toLowerCase().includes('serif') ? 'serif' : 'sans-serif'
  return `'${font.cssName}', ${fallback}`
}

export function loadGoogleFonts(fontNames: string[]): void {
  const unique = Array.from(new Set(fontNames.filter(Boolean)))
  if (unique.length === 0) return

  const families = unique
    .map((name) => {
      const encoded = name.trim().replace(/ /g, '+')
      return `family=${encoded}:wght@300;400;500;600;700;800`
    })
    .join('&')

  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`

  // Avoid duplicates
  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

export function formatTime12(time: string | null | undefined): string {
  if (!time) return ''
  const match = time.match(/^(\d{2}):(\d{2})/)
  if (!match) return time
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes} ${period}`
}

export function timeTo24(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return time12
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}
