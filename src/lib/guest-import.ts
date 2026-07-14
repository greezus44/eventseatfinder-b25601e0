import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedGuest {
  name: string
  tableName: string
}

export interface ImportResult {
  guests: ParsedGuest[]
  totalFound: number
  format: string
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

export function classifyError(error: unknown): string {
  if (error instanceof ImportError) return 'import'
  if (error instanceof TypeError) return 'type'
  if (error instanceof Error) return error.message
  return 'unknown'
}

export function matchTableByName(tableName: string, tables: { id: string; name: string }[]): string | null {
  const normalized = tableName.toLowerCase().trim()
  const exact = tables.find((t) => t.name.toLowerCase() === normalized)
  if (exact) return exact.id
  const partial = tables.find((t) => t.name.toLowerCase().includes(normalized) || normalized.includes(t.name.toLowerCase()))
  return partial?.id ?? null
}

async function parseCSV(file: File): Promise<ParsedGuest[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const guests: ParsedGuest[] = []
        for (const row of results.data as Record<string, string>[]) {
          const name = (row.name || row.Name || row.NAME || row['Guest Name'] || row['Full Name'] || '').trim()
          const table = (row.table || row.Table || row['Table Name'] || row['Table'] || '').trim()
          if (name) guests.push({ name, tableName: table })
        }
        resolve(guests)
      },
      error: (err) => reject(new ImportError(err.message)),
    })
  })
}

async function parseXLSX(file: File): Promise<ParsedGuest[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws)
  const guests: ParsedGuest[] = []
  for (const row of rows) {
    const name = (row.name || row.Name || row.NAME || row['Guest Name'] || row['Full Name'] || '').trim()
    const table = (row.table || row.Table || row['Table Name'] || row['Table'] || '').trim()
    if (name) guests.push({ name, tableName: table })
  }
  return guests
}

async function parsePDF(file: File): Promise<ParsedGuest[]> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let text = ''
  for (let i = 0; i < bytes.length; i++) {
    const c = String.fromCharCode(bytes[i])
    text += c
  }
  const guests: ParsedGuest[] = []
  const btEtBlocks = text.match(/BT[\s\S]*?ET/g) || []
  for (const block of btEtBlocks) {
    const textMatches = block.match(/\(([^)]*)\)/g) || []
    for (const tm of textMatches) {
      const content = tm.slice(1, -1).trim()
      if (content && /[a-zA-Z]/.test(content) && content.length > 1) {
        guests.push({ name: content, tableName: '' })
      }
    }
  }
  return guests
}

export async function parseFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  let guests: ParsedGuest[] = []
  let format = ''
  if (ext === 'csv') { guests = await parseCSV(file); format = 'CSV' }
  else if (ext === 'xlsx' || ext === 'xls') { guests = await parseXLSX(file); format = 'Excel' }
  else if (ext === 'pdf') { guests = await parsePDF(file); format = 'PDF' }
  else throw new ImportError(`Unsupported file format: .${ext}`)
  return { guests, totalFound: guests.length, format }
}
