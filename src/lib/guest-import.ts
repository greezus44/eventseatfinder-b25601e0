import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedGuest { name: string; tableName: string }
export interface ImportResult { guests: ParsedGuest[]; totalFound: number; format: string }
export class ImportError extends Error { constructor(m: string) { super(m); this.name = 'ImportError' } }
export function classifyError(error: unknown): string {
  if (error instanceof ImportError) return 'import'
  if (error instanceof Error) return error.message
  return 'unknown'
}
export function matchTableByName(tableName: string, tables: { id: string; name: string }[]): string | null {
  const n = tableName.toLowerCase().trim()
  const exact = tables.find((t) => t.name.toLowerCase() === n)
  if (exact) return exact.id
  const partial = tables.find((t) => t.name.toLowerCase().includes(n) || n.includes(t.name.toLowerCase()))
  return partial?.id ?? null
}
async function parseCSV(file: File): Promise<ParsedGuest[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: (results) => {
      const guests: ParsedGuest[] = []
      for (const row of results.data as Record<string, string>[]) {
        const name = (row.name || row.Name || row.NAME || row['Guest Name'] || row['Full Name'] || '').trim()
        const table = (row.table || row.Table || row['Table Name'] || '').trim()
        if (name) guests.push({ name, tableName: table })
      }
      resolve(guests)
    }, error: (err) => reject(new ImportError(err.message)) })
  })
}
async function parseXLSX(file: File): Promise<ParsedGuest[]> {
  const buf = await file.arrayBuffer(); const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)
  return rows.map((row) => ({ name: (row.name || row.Name || row['Guest Name'] || row['Full Name'] || '').trim(), tableName: (row.table || row.Table || row['Table Name'] || '').trim() })).filter((g) => g.name)
}
async function parsePDF(file: File): Promise<ParsedGuest[]> {
  const buf = await file.arrayBuffer(); const bytes = new Uint8Array(buf); let text = ''
  for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i])
  const guests: ParsedGuest[] = []
  for (const block of text.match(/BT[\s\S]*?ET/g) || []) {
    for (const tm of block.match(/\(([^)]*)\)/g) || []) {
      const c = tm.slice(1, -1).trim()
      if (c && /[a-zA-Z]/.test(c) && c.length > 1) guests.push({ name: c, tableName: '' })
    }
  }
  return guests
}
export async function parseFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  let guests: ParsedGuest[] = []; let format = ''
  if (ext === 'csv') { guests = await parseCSV(file); format = 'CSV' }
  else if (ext === 'xlsx' || ext === 'xls') { guests = await parseXLSX(file); format = 'Excel' }
  else if (ext === 'pdf') { guests = await parsePDF(file); format = 'PDF' }
  else throw new ImportError(`Unsupported format: .${ext}`)
  return { guests, totalFound: guests.length, format }
}
