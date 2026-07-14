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
]

export function getFontCss(name: string | null | undefined): string {
  if (!name) return 'Inter, sans-serif'
  const font = FONTS.find((f) => f.name === name || f.cssName === name)
  return font ? `'${font.cssName}', sans-serif` : `'${name}', sans-serif`
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

export function formatTime12(time: string | null | undefined): string {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const period = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${period}`
}

export function timeTo24(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return time12
  let h = parseInt(match[1], 10)
  const m = match[2]
  const period = match[3].toUpperCase()
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${m}`
}
