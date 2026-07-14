export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}
export function nameMatches(search: string, guestName: string): boolean {
  const ns = normalizeName(search), ng = normalizeName(guestName)
  if (!ns || !ng) return false
  if (ng.includes(ns)) return true
  const st = ns.split(' ').filter(Boolean), gt = ng.split(' ').filter(Boolean)
  if (st.length === 0) return false
  if (st.every((s) => gt.some((g) => g.startsWith(s)))) return true
  if (gt.join('').includes(ns.replace(/\s+/g, ''))) return true
  return false
}
export interface GuestSearchResult { id: string; name: string; table_name: string; table_number: number }
interface GuestWithTableLike { id: string; name: string; table_id: string | null; tables?: { name: string; number: number } | { name: string; number: number }[] | null }
export function searchGuests(guests: GuestWithTableLike[], query: string, limit = 50): GuestSearchResult[] {
  const results: GuestSearchResult[] = []
  for (const g of guests) {
    if (nameMatches(query, g.name)) {
      const table = Array.isArray(g.tables) ? g.tables[0] : g.tables
      results.push({ id: g.id, name: g.name, table_name: table?.name ?? 'Unassigned', table_number: table?.number ?? 0 })
      if (results.length >= limit) break
    }
  }
  return results
}
