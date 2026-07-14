import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { GuestInput, Table } from '@/types';

export interface ParsedGuestRow {
  name: string;
  table: string | null;
}

export interface ImportResult {
  guests: ParsedGuestRow[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export type ImportStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'matching'
  | 'importing'
  | 'complete'
  | 'error';

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  rawValue?: string;
}

export interface MappedGuest {
  name: string;
  table_id: string | null;
  table_name: string | null;
}

export interface ImportSummary {
  totalRows: number;
  parsedRows: number;
  mappedGuests: MappedGuest[];
  unmatchedTables: string[];
  errors: ImportError[];
  warnings: string[];
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeTableName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseFile(
  file: File,
  onProgress?: (stage: ImportStage) => void
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    onProgress?.('uploading');

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv') || file.type === 'text/csv';
    const isExcel =
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');

    if (!isCSV && !isExcel) {
      reject(new Error('Invalid file format. Please upload a CSV or XLSX file.'));
      return;
    }

    onProgress?.('parsing');

    if (isCSV) {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          try {
            const parsed = processRows(result.data as Record<string, string>[], result.errors);
            resolve(parsed);
          } catch (err) {
            reject(
              new Error(
                err instanceof Error
                  ? `File could not be parsed: ${err.message}`
                  : 'File could not be parsed'
              )
            );
          }
        },
        error: (err: Error) => {
          reject(new Error(`File could not be parsed: ${err.message}`));
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
            defval: '',
          });
          const parsed = processRows(rows, []);
          resolve(parsed);
        } catch (err) {
          reject(
            new Error(
              err instanceof Error
                ? `Invalid Excel format: ${err.message}`
                : 'Invalid Excel format. Could not read the file.'
            )
          );
        }
      };
      reader.onerror = () => {
        reject(new Error('File could not be read. It may be corrupted or locked by another program.'));
      };
      reader.readAsArrayBuffer(file);
    }
  });
}

function processRows(
  rows: Record<string, string>[],
  parseErrors: { message: string; row?: number }[]
): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rows.length === 0) {
    return {
      guests: [],
      errors: ['File is empty or has no data rows.'],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }

  const firstRow = rows[0];
  const keys = Object.keys(firstRow).map((k) => k.toLowerCase().trim());

  const nameKey = keys.find((k) => k === 'name' || k === 'guest name' || k === 'guest' || k === 'full name');
  const tableKey = keys.find((k) => k === 'table' || k === 'table name' || k === 'table number' || k === 'assigned table');

  if (!nameKey) {
    const availableCols = Object.keys(firstRow).join(', ');
    return {
      guests: [],
      errors: [
        `Missing required column: "Name". Expected one of: name, guest name, guest, full name. Found columns: ${availableCols}`,
      ],
      warnings: [],
      totalRows: rows.length,
      validRows: 0,
    };
  }

  if (parseErrors.length > 0) {
    parseErrors.forEach((e) => {
      errors.push(`Row ${(e.row ?? 0) + 1}: ${e.message}`);
    });
  }

  const guests: ParsedGuestRow[] = [];
  let validRows = 0;
  const seenNames = new Set<string>();

  rows.forEach((row, index) => {
    const originalKey = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === nameKey
    );
    const rawName = originalKey ? row[originalKey] : '';
    const name = normalizeName(rawName || '');

    if (!name) {
      warnings.push(`Row ${index + 2}: Missing guest name — skipped.`);
      return;
    }

    if (seenNames.has(name.toLowerCase())) {
      warnings.push(`Row ${index + 2}: Duplicate guest "${name}" — skipped.`);
      return;
    }
    seenNames.add(name.toLowerCase());

    let table: string | null = null;
    if (tableKey) {
      const originalTableKey = Object.keys(row).find(
        (k) => k.toLowerCase().trim() === tableKey
      );
      const rawTable = originalTableKey ? row[originalTableKey] : '';
      if (rawTable && rawTable.trim()) {
        table = rawTable.trim();
      }
    }

    guests.push({ name, table });
    validRows++;
  });

  console.log('[Import] Parsed rows:', {
    totalRows: rows.length,
    validRows,
    guestsWithTables: guests.filter((g) => g.table).length,
    guestsWithoutTables: guests.filter((g) => !g.table).length,
  });

  return {
    guests,
    errors,
    warnings,
    totalRows: rows.length,
    validRows,
  };
}

export function matchGuestsToTables(
  parsedGuests: ParsedGuestRow[],
  tables: Table[]
): ImportSummary {
  console.log('[Import] Matching guests to tables', {
    guestCount: parsedGuests.length,
    tableCount: tables.length,
    tables: tables.map((t) => ({ id: t.id, name: t.name, number: t.number })),
  });

  const tableMap = new Map<string, Table>();
  tables.forEach((t) => {
    tableMap.set(normalizeTableName(t.name), t);
    tableMap.set(normalizeTableName(String(t.number)), t);
    tableMap.set(normalizeTableName(`Table ${t.number}`), t);
    tableMap.set(normalizeTableName(`Table ${t.name}`), t);
  });

  const mappedGuests: MappedGuest[] = [];
  const unmatchedTables: string[] = [];
  const errors: ImportError[] = [];
  const seenNames = new Set<string>();

  parsedGuests.forEach((g, index) => {
    const row = index + 2;

    if (!g.name) {
      errors.push({ row, field: 'name', message: 'Missing guest name' });
      return;
    }

    if (seenNames.has(g.name.toLowerCase())) {
      errors.push({ row, field: 'name', message: `Duplicate guest: "${g.name}"`, rawValue: g.name });
      return;
    }
    seenNames.add(g.name.toLowerCase());

    let table_id: string | null = null;
    let table_name: string | null = null;

    if (g.table) {
      const normalizedTable = normalizeTableName(g.table);
      const matchedTable = tableMap.get(normalizedTable);
      if (matchedTable) {
        table_id = matchedTable.id;
        table_name = matchedTable.name;
      } else {
        unmatchedTables.push(g.table);
      }
    }

    mappedGuests.push({ name: g.name, table_id, table_name });
  });

  const uniqueUnmatched = [...new Set(unmatchedTables)];

  console.log('[Import] Matching complete', {
    mappedGuests: mappedGuests.length,
    unmatchedTables: uniqueUnmatched,
    sampleMapped: mappedGuests.slice(0, 5),
  });

  return {
    totalRows: parsedGuests.length,
    parsedRows: mappedGuests.length,
    mappedGuests,
    unmatchedTables: uniqueUnmatched,
    errors,
    warnings: [],
  };
}

export function buildGuestPayload(
  mappedGuests: MappedGuest[],
  eventId: string
): { event_id: string; name: string; table_id: string | null }[] {
  const payload = mappedGuests.map((g) => ({
    event_id: eventId,
    name: g.name,
    table_id: g.table_id,
  }));

  console.log('[Import] Built payload', {
    eventId,
    count: payload.length,
    sample: payload.slice(0, 3),
    withTable: payload.filter((p) => p.table_id).length,
    withoutTable: payload.filter((p) => !p.table_id).length,
  });

  return payload;
}

export function classifyError(err: unknown): string {
  if (!err) return 'Unknown error';

  if (err instanceof Error) {
    const msg = err.message;

    if (msg.includes('permission') || msg.toLowerCase().includes('rls') || msg.includes('policy')) {
      return `Permission denied: ${msg}. Make sure you are signed in and own this event.`;
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
      return `Network error: ${msg}. Check your internet connection and try again.`;
    }
    if (msg.includes('duplicate key') || msg.includes('already exists')) {
      return `Duplicate guest: ${msg}. A guest with this name may already exist.`;
    }
    if (msg.includes('violates') || msg.includes('constraint')) {
      return `Validation failed: ${msg}. Check that all required fields are correct.`;
    }
    if (msg.includes('Invalid file') || msg.includes('could not be parsed') || msg.includes('Invalid Excel')) {
      return msg;
    }
    if (msg.includes('Missing required')) {
      return msg;
    }
    if (msg.includes('Database insert failed')) {
      return msg;
    }

    return msg;
  }

  if (typeof err === 'string') return err;

  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: string; code?: string; details?: string };
    if (e.message) {
      if (e.code === '42501' || e.message.includes('permission')) {
        return `Permission denied: ${e.message}. You may not have access to this event.`;
      }
      if (e.code === '23505') {
        return `Duplicate guest: ${e.details || e.message}. This guest already exists.`;
      }
      if (e.code === '23503') {
        return `Table does not exist: ${e.details || e.message}. The referenced table was not found.`;
      }
      return `Supabase error: ${e.message}${e.details ? ` (${e.details})` : ''}`;
    }
  }

  return 'Unknown error';
}
