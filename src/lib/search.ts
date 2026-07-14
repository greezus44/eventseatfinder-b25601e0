export interface GuestSearchResult {
  id: string
  name: string
  table_id: string | null
  table_name: string
}

interface GuestLike {
  id: string
  name: string
  table_id: string | null
  tables: { name: string; number: number }[] | null
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function searchGuests(guests: GuestLike[], query: string, limit = 50): GuestSearchResult[] {
  const q = normalize(query)
  if (!q) return []
  const scored: { result: GuestSearchResult; score: number }[] = []
  for (const g of guests) {
    const name = normalize(g.name)
    let score = 0
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80
    else if (name.includes(q)) score = 60
    else {
      const words = name.split(/\s+/)
      if (words.some((w) => w.startsWith(q))) score = 40
      else if (words.some((w) => w.includes(q))) score = 20
      else continue
    }
    const tableRow = Array.isArray(g.tables) ? g.tables[0] : g.tables
    scored.push({
      result: {
        id: g.id,
        name: g.name,
        table_id: g.table_id,
        table_name: tableRow?.name ?? 'Unassigned',
      },
      score,
    })
  }
  return scored.sort((a, b) => b.score - a.score || a.result.name.localeCompare(b.result.name)).slice(0, limit).map((s) => s.result)
}
