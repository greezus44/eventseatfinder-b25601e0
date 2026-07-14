export function fuzzyMatch(query: string, name: string): boolean {
  const q = query.toLowerCase().trim()
  const n = name.toLowerCase().trim()
  if (!q) return false
  if (n.includes(q)) return true
  const qWords = q.split(/\s+/)
  const nWords = n.split(/\s+/)
  return qWords.every(qw => nWords.some(nw => nw.startsWith(qw) || nw.includes(qw)))
}

export function searchGuests<T extends { id: string; name: string }>(query: string, guests: T[]): T[] {
  if (!query.trim()) return []
  return guests
    .filter(g => fuzzyMatch(query, g.name))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase().trim())
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase().trim())
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, 20)
}
