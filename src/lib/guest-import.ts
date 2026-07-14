import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { GuestInput } from '@/types';

export type ImportErrorType =
  | 'parse'
  | 'match'
  | 'build'
  | 'unknown';

export interface ClassifiedError {
  message: string;
  type: ImportErrorType;
}

export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('parse') || msg.includes('csv') || msg.includes('xlsx')) {
      return { message: err.message, type: 'parse' };
    }
    if (msg.includes('match') || msg.includes('table')) {
      return { message: err.message, type: 'match' };
    }
    if (msg.includes('build') || msg.includes('payload')) {
      return { message: err.message, type: 'build' };
    }
    return { message: err.message, type: 'unknown' };
  }
  const str = String(err);
  return { message: str, type: 'unknown' };
}

export interface ParsedRow {
  name: string;
  tableName?: string;
}

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows: ParsedRow[] = results.data
            .filter((r: any) => r.name && r.name.trim())
            .map((r: any) => ({
              name: String(r.name).trim(),
              tableName: r.tableName || r.table_name || r.table || undefined,
            }));
          resolve(rows);
        },
        error: (err) => reject(err),
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
    return json
      .filter((r) => r.name && String(r.name).trim())
      .map((r) => ({
        name: String(r.name).trim(),
        tableName: r.tableName || r.table_name || r.table || undefined,
      }));
  }

  // Fallback: try CSV parsing
  return new Promise((resolve, reject) => {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = results.data
          .filter((r: any) => r.name && r.name.trim())
          .map((r: any) => ({
            name: String(r.name).trim(),
            tableName: r.tableName || r.table_name || r.table || undefined,
          }));
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}

export interface MatchResult {
  matched: { row: ParsedRow; tableId: string | null }[];
  unmatched: ParsedRow[];
}

export function matchGuestsToTables(
  rows: ParsedRow[],
  tables: { id: string; name: string }[]
): MatchResult {
  const tableMap = new Map<string, string>();
  for (const t of tables) {
    tableMap.set(t.name.toLowerCase().trim(), t.id);
  }

  const matched: { row: ParsedRow; tableId: string | null }[] = [];
  const unmatched: ParsedRow[] = [];

  for (const row of rows) {
    if (row.tableName) {
      const tableId = tableMap.get(row.tableName.toLowerCase().trim()) ?? null;
      matched.push({ row, tableId });
      if (!tableId) {
        unmatched.push(row);
      }
    } else {
      matched.push({ row, tableId: null });
    }
  }

  return { matched, unmatched };
}

export function buildGuestPayload(
  matchResult: MatchResult
): GuestInput[] {
  return matchResult.matched.map(({ row, tableId }) => ({
    name: row.name,
    table_id: tableId,
  }));
}
