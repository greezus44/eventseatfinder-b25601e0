/**
 * Normalise a string for forgiving guest name search.
 * Removes accents, punctuation, hyphens, apostrophes, and collapses spaces.
 * "John-Tan" → "john tan", "Nur Aisyah" → "nur aisyah", "José O'Brien" → "jose obrien"
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if a search query matches a guest name using forgiving normalisation.
 * Supports partial matching: "Muh" matches "Muhammad Bin Ali", "Ali" matches "Muhammad Bin Ali".
 * Also matches concatenated forms: "johntan" matches "John Tan".
 */
export function nameMatches(search: string, guestName: string): boolean {
  const normalizedSearch = normalizeName(search)
  const normalizedGuest = normalizeName(guestName)
  if (!normalizedSearch || !normalizedGuest) return false

  // Direct substring match (partial): "muh" in "muhammad bin ali"
  if (normalizedGuest.includes(normalizedSearch)) return true

  // Token-based match: each search token must match the start of some guest token
  // "bin ali" → tokens ["bin", "ali"] must each be a prefix of some guest token
  const searchTokens = normalizedSearch.split(' ').filter(Boolean)
  const guestTokens = normalizedGuest.split(' ').filter(Boolean)

  if (searchTokens.length === 0) return false

  const allTokensMatch = searchTokens.every((st) =>
    guestTokens.some((gt) => gt.startsWith(st))
  )
  if (allTokensMatch) return true

  // Concatenated match: "johntan" matches "john tan" → "johntan"
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

/**
 * Search guests client-side with forgiving matching.
 * @param guests Array of guests with name and table info
 * @param query Search query string
 * @param limit Max results to return (default 10)
 */
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
