export type ParsedGuest = { name: string; table: string }

export function parseGuestList(text: string): ParsedGuest[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const guests: ParsedGuest[] = []
  for (const line of lines) {
    const tabMatch = line.match(/\t+/)
    if (tabMatch) {
      const parts = line.split(/\t+/).map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        guests.push({ name: parts[0], table: parts[1] })
        continue
      }
    }
    const commaMatch = line.match(/,\s+/)
    if (commaMatch) {
      const parts = line.split(/,\s+/).map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        guests.push({ name: parts[0], table: parts[1] })
        continue
      }
    }
    guests.push({ name: line, table: '' })
  }
  return guests
}

export function parseCSV(text: string): ParsedGuest[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const guests: ParsedGuest[] = []
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    if (parts.length >= 2) {
      guests.push({ name: parts[0], table: parts[1] })
    } else if (parts.length === 1 && parts[0]) {
      guests.push({ name: parts[0], table: '' })
    }
  }
  return guests
}
