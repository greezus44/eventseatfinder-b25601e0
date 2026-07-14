import * as XLSX from 'xlsx'
export interface ParsedGuest { name: string; tableName: string }
export interface ParseResult { guests: ParsedGuest[]; format: string }
export function classifyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) return 'Some guest names already exist'
    if (err.message.includes('network') || err.message.includes('fetch')) return 'Network error — please try again'
    return err.message
  }
  return 'An unexpected error occurred'
}
export function matchTableByName(tableName: string, tables: { id: string; name: string }[]): string | null {
  const norm = tableName.trim().toLowerCase()
  return tables.find((t) => t.name.toLowerCase() === norm)?.id ?? null
}
function rowToGuest(row: Record<string, unknown>): ParsedGuest | null {
  const nameKey = Object.keys(row).find((k) => ['name', 'guest', 'guest name', 'full name', 'fullname', 'guestname'].includes(k.toLowerCase()))
  const tableKey = Object.keys(row).find((k) => ['table', 'table name', 'tablename', 'table number', 'tablenumber', 'seat', 'seating'].includes(k.toLowerCase()))
  const name = nameKey ? String(row[nameKey] ?? '').trim() : ''
  if (!name) return null
  return { name, tableName: tableKey ? String(row[tableKey] ?? '').trim() : '' }
}
async function parseCsv(file: File): Promise<ParseResult> {
  const text = await file.text()
  const wb = XLSX.read(text, { type: 'string' }); const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
  const guests = rows.map(rowToGuest).filter((g): g is ParsedGuest => g !== null)
  if (guests.length === 0) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const firstIsHeader = /name|guest|table/i.test(lines[0] ?? '')
    const data = firstIsHeader ? lines.slice(1) : lines
    return { guests: data.filter(Boolean).map((l) => ({ name: l.split(',')[0].trim(), tableName: l.split(',')[1]?.trim() ?? '' })), format: 'CSV' }
  }
  return { guests, format: 'CSV' }
}
async function parseExcel(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer(); const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
  return { guests: rows.map(rowToGuest).filter((g): g is ParsedGuest => g !== null), format: 'Excel' }
}
async function parsePdf(file: File): Promise<ParseResult> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const buf = await file.arrayBuffer(); const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const lines: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i); const content = await page.getTextContent()
    lines.push(...content.items.filter((item): item is typeof item & { str: string } => 'str' in item).map((item) => item.str.trim()).filter(Boolean))
  }
  return { guests: lines.filter((l) => l.length > 1 && !/^\d+$/.test(l) && !/^(name|guest|table|no\.?|#)/i.test(l)).map((l) => { const parts = l.split(/\t|  +/); return { name: parts[0].trim(), tableName: parts[1]?.trim() ?? '' } }), format: 'PDF' }
}
export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv' || file.type === 'text/csv') return parseCsv(file)
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file)
  if (ext === 'pdf' || file.type === 'application/pdf') return parsePdf(file)
  throw new Error('Unsupported file type. Please use CSV, Excel, or PDF.')
}
