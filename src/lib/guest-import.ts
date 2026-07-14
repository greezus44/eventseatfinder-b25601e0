// Guest list import: parse CSV / XLSX / PDF into { name, tableName } rows.

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

/**
 * Maps an arbitrary thrown value to a short, human-readable error code.
 */
export function classifyError(error: unknown): string {
  if (error instanceof ImportError) return 'import'
  if (error instanceof DOMException && error.name === 'NotFoundError') return 'not_found'
  if (error instanceof TypeError) return 'type'
  if (error instanceof RangeError) return 'range'
  if (error instanceof SyntaxError) return 'syntax'
  if (error instanceof Error) return 'unknown'
  if (typeof error === 'string') return 'string'
  return 'unknown'
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

/**
 * Parses a guest list file. CSV via PapaParse (header:true), XLSX/XLS via
 * SheetJS, and PDF via a basic latin1 text extraction that scans for BT/ET
 * text blocks. Returns the parsed guests plus the detected format.
 */
export async function parseFile(file: File): Promise<ImportResult> {
  const lowerName = file.name.toLowerCase()
  const isCsv = lowerName.endsWith('.csv') || file.type === 'text/csv'
  const isXlsx = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')

  if (isCsv) {
    return parseCsv(file)
  }
  if (isXlsx) {
    return parseXlsx(file)
  }
  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    return parsePdf(file)
  }
  throw new ImportError(`Unsupported file type: ${file.name}`)
}

function parseCsv(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const guests: ParsedGuest[] = []
        for (const row of results.data) {
          const name = pickField(row, ['name', 'guest', 'guest name', 'fullname', 'full name'])
          const tableName = pickField(row, ['table', 'table name', 'tablename'])
          if (name) guests.push({ name, tableName: tableName || '' })
        }
        resolve({ guests, totalFound: guests.length, format: 'csv' })
      },
      error: (err) => reject(new ImportError(err.message)),
    })
  })
}

async function parseXlsx(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const guests: ParsedGuest[] = []
  for (const row of rows) {
    const name = pickField(row, ['name', 'guest', 'guest name', 'fullname', 'full name'])
    const tableName = pickField(row, ['table', 'table name', 'tablename'])
    if (name) guests.push({ name, tableName: tableName || '' })
  }
  return { guests, totalFound: guests.length, format: 'xlsx' }
}

async function parsePdf(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let raw = ''
  for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i])
  // latin1 decode preserves byte values for the regex scan below.
  const text = decodeLatin1(raw)

  const guests: ParsedGuest[] = []
  const blockRegex = /BT([\s\S]*?)ET/g
  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(text)) !== null) {
    const block = match[1]
    const textParts: string[] = []
    const textRegex = /\(([^)]*)\)\s*Tj/g
    let tm: RegExpExecArray | null
    while ((tm = textRegex.exec(block)) !== null) {
      textParts.push(tm[1])
    }
    const line = textParts.join('').trim()
    if (!line) continue
    const [name, tableName = ''] = line.split(/[\t,;]/).map((s) => s.trim())
    if (name) guests.push({ name, tableName })
  }
  return { guests, totalFound: guests.length, format: 'pdf' }
}

function decodeLatin1(raw: string): string {
  // raw was built with fromCharCode on each byte, so it already represents
  // latin1 code points; this is a no-op pass that keeps the string intact.
  return raw
}

function pickField(row: Record<string, unknown>, keys: string[]): string {
  const lowerRow: Record<string, unknown> = {}
  for (const key of Object.keys(row)) lowerRow[key.toLowerCase()] = row[key]
  for (const key of keys) {
    const value = lowerRow[key.toLowerCase()]
    if (value !== undefined && value !== null) {
      const normalized = normalizeCell(value)
      if (normalized) return normalized
    }
  }
  return ''
}

/**
 * Finds a table id whose name matches the given tableName (case-insensitive,
 * trimmed). Returns the matching table's id, or null when no match is found.
 */
export function matchTableByName(
  tableName: string,
  tables: { id: string; name: string; number: number }[],
): string | null {
  const target = tableName.trim().toLowerCase()
  if (!target) return null
  const byName = tables.find((t) => t.name.trim().toLowerCase() === target)
  if (byName) return byName.id
  const byNumber = tables.find((t) => String(t.number) === target)
  if (byNumber) return byNumber.id
  return null
}
