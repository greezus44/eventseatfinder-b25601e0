import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParsedGuest { name: string; tableName: string }
export interface ParseResult { guests: ParsedGuest[]; format: string }

export function classifyError(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred'
}

export function matchTableByName(tableName: string, tables: { id: string; name: string }[]): string | null {
  const norm = tableName.toLowerCase().trim()
  const match = tables.find((t) => t.name.toLowerCase() === norm)
  if (match) return match.id
  const partial = tables.find((t) => t.name.toLowerCase().includes(norm) || norm.includes(t.name.toLowerCase()))
  return partial?.id ?? null
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file)
  if (ext === 'pdf') return parsePDF(file)
  throw new Error(`Unsupported file format: .${ext}`)
}

async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const guests: ParsedGuest[] = []
        for (const row of result.data as Record<string, string>[]) {
          const name = (row.Name || row.name || row.Guest || row.guest || '').trim()
          if (name) guests.push({ name, tableName: (row.Table || row.table || '').trim() })
        }
        resolve({ guests, format: 'CSV' })
      },
      error: (err) => reject(err),
    })
  })
}

async function parseXLSX(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
  const guests: ParsedGuest[] = []
  for (const row of rows) {
    const name = String(row.Name || row.name || row.Guest || row.guest || '').trim()
    if (name) guests.push({ name, tableName: String(row.Table || row.table || '').trim() })
  }
  return { guests, format: 'Excel' }
}

async function parsePDF(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer()
  const text = await extractPdfText(buf)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const guests: ParsedGuest[] = []
  for (const line of lines) {
    const parts = line.split(/\t+|\s{2,}/)
    const name = parts[0]?.trim()
    if (name) guests.push({ name, tableName: parts[1]?.trim() ?? '' })
  }
  return { guests, format: 'PDF' }
}

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item) => 'str' in item ? item.str ?? '' : '').join('\n') + '\n'
    }
    return text
  } catch {
    return ''
  }
}
