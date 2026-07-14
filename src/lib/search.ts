export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function nameMatches(search: string, guestName: string): boolean {
  const normalizedSearch = normalizeName(search)
  const normalizedGuest = normalizeName(guestName)
  if (!normalizedSearch || !normalizedGuest) return false
  if (normalizedGuest.includes(normalizedSearch)) return true
  const searchTokens = normalizedSearch.split(' ').filter(Boolean)
  const guestTokens = normalizedGuest.split(' ').filter(Boolean)
  if (searchTokens.length === 0) return false
  const allTokensMatch = searchTokens.every((st) =>
    guestTokens.some((gt) => gt.startsWith(st))
  )
  if (allTokensMatch) return true
  const concatenated = guestTokens.join('')
  if (concatenated.includes(normalizedSearch.replace(/\s+/g, ''))) return true
  return false
}

export interface GuestSearchResult {
  id: string
  name: string
  table_name: string
  table_number: number
}

interface GuestWithTableLike {
  id: string
  name: string
  table_id: string | null
  tables?: { name: string; number: number } | { name: string; number: number }[] | null
}

export function searchGuests(
  guests: GuestWithTableLike[],
  query: string,
  limit: number = 10
): GuestSearchResult[] {
  const results: GuestSearchResult[] = []
  for (const g of guests) {
    if (nameMatches(query, g.name)) {
      const table = Array.isArray(g.tables) ? g.tables[0] : g.tables
      results.push({
        id: g.id,
        name: g.name,
        table_name: table?.name ?? 'Unassigned',
        table_number: table?.number ?? 0,
      })
      if (results.length >= limit) break
    }
  }
  return results
}
