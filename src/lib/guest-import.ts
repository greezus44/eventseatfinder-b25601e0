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
  if (error instanceof ImportError) return error.message
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Check your connection and try again.'
    if (msg.includes('permission') || msg.includes('rls') || msg.includes('policy')) return 'Permission denied. You may not have access to this event.'
    if (msg.includes('duplicate')) return 'Some guests already exist in this event.'
    if (msg.includes('parse') || msg.includes('invalid')) return 'Could not parse the file. Check the format and try again.'
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

function extractNamesFromText(text: string): ParsedGuest[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const guests: ParsedGuest[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const separators = ['\t', ',', ' - ', ' | ', ';']
    let parsed = false

    for (const sep of separators) {
      if (trimmed.includes(sep)) {
        const parts = trimmed.split(sep).map((p) => p.trim()).filter(Boolean)
        if (parts.length >= 2) {
          const name = parts[0]
          const tablePart = parts.slice(1).join(' ')
          if (name.length > 0 && name.length < 200) {
            guests.push({ name, tableName: tablePart })
            parsed = true
            break
          }
        }
      }
    }

    if (!parsed && trimmed.length > 0 && trimmed.length < 200) {
      guests.push({ name: trimmed, tableName: '' })
    }
  }

  return guests
}

export async function parseFile(file: File): Promise<ImportResult> {
  const ext = file.name.toLowerCase().split('.').pop() ?? ''

  if (ext === 'csv') return parseCSV(file)
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file)
  if (ext === 'pdf') return parsePDF(file)
  return parseCSV(file)
}

async function parseCSV(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const guests: ParsedGuest[] = []
        for (const row of results.data) {
          const cells = (row as string[]).map((c) => (c ?? '').trim()).filter(Boolean)
          if (cells.length === 0) continue
          const name = cells[0]
          const tableName = cells.length > 1 ? cells[1] : ''
          if (name) guests.push({ name, tableName })
        }
        resolve({ guests, totalFound: guests.length, format: 'CSV' })
      },
      error: (err) => reject(new ImportError(`CSV parse error: ${err.message}`)),
    })
  })
}

async function parseExcel(file: File): Promise<ImportResult> {
  try {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false })

    const guests: ParsedGuest[] = []
    for (const row of rows) {
      const cells = (row ?? []).map((c) => String(c ?? '').trim()).filter(Boolean)
      if (cells.length === 0) continue
      const name = cells[0]
      const tableName = cells.length > 1 ? cells[1] : ''
      if (name) guests.push({ name, tableName })
    }

    return { guests, totalFound: guests.length, format: 'Excel' }
  } catch {
    throw new ImportError('Could not read the Excel file. Make sure it is a valid .xlsx or .xls file.')
  }
}

async function parsePDF(file: File): Promise<ImportResult> {
  try {
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    const decoder = new TextDecoder('latin1')
    const raw = decoder.decode(bytes)

    const regex = /\(([^)]*)\)\s*Tj/g
    let match: RegExpExecArray | null
    const lines: string[] = []
    let currentLine = ''

    while ((match = regex.exec(raw)) !== null) {
      const fragment = match[1]
      if (fragment.includes(')') && !fragment.startsWith('\\')) {
        currentLine += fragment
        lines.push(currentLine)
        currentLine = ''
      } else {
        currentLine += fragment + ' '
      }
    }
    if (currentLine) lines.push(currentLine)

    let text = lines.join('\n')

    if (!text.trim()) {
      const simpleRegex = /\(([^)]+)\)/g
      const allText: string[] = []
      while ((match = simpleRegex.exec(raw)) !== null) {
        const t = match[1]
        if (t.length > 1 && !/^[0-9]+$/.test(t) && !t.startsWith('/')) {
          allText.push(t)
        }
      }
      text = allText.join('\n')
    }

    if (!text.trim()) {
      throw new ImportError('Could not extract text from PDF. Try converting to CSV or Excel.')
    }

    const guests = extractNamesFromText(text)
    if (guests.length === 0) {
      throw new ImportError('No guest names found in the PDF.')
    }

    return { guests, totalFound: guests.length, format: 'PDF' }
  } catch (e) {
    if (e instanceof ImportError) throw e
    throw new ImportError('Could not read the PDF file. Try converting to CSV or Excel for better results.')
  }
}

export function matchTableByName(
  tableName: string,
  tables: { id: string; name: string; number: number }[]
): string | null {
  if (!tableName || !tableName.trim()) return null

  const normalized = tableName.trim().toLowerCase()

  const exact = tables.find((t) => t.name.trim().toLowerCase() === normalized)
  if (exact) return exact.id

  const tableNumMatch = normalized.match(/table\s*(\d+)/)
  if (tableNumMatch) {
    const num = parseInt(tableNumMatch[1], 10)
    const byNum = tables.find((t) => t.number === num)
    if (byNum) return byNum.id
  }

  const num = parseInt(normalized, 10)
  if (!isNaN(num)) {
    const byNum = tables.find((t) => t.number === num)
    if (byNum) return byNum.id
  }

  const partial = tables.find(
    (t) => t.name.trim().toLowerCase().includes(normalized) || normalized.includes(t.name.trim().toLowerCase())
  )
  if (partial) return partial.id

  return null
}
