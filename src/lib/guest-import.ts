import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { GuestInput, Table } from '@/types';

export type ImportStage =
  | 'idle'
  | 'parsing'
  | 'matching'
  | 'building'
  | 'complete'
  | 'error';

export interface ImportSummary {
  total: number;
  matched: number;
  unmatched: number;
  tablesAssigned: number;
}

export interface ParsedGuest {
  name?: string;
  table?: string;
  [key: string]: unknown;
}

export interface MappedGuest extends GuestInput {
  rawTable?: string;
}

export interface ClassifiedError {
  message: string;
  type: 'file' | 'format' | 'network' | 'permission' | 'unknown';
}

export async function parseFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ParsedGuest[]> {
  onProgress?.(0);
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv' || ext === 'txt') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          onProgress?.(100);
          resolve(results.data as ParsedGuest[]);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    onProgress?.(50);
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    onProgress?.(100);
    return rows as unknown as ParsedGuest[];
  }

  throw new Error('Unsupported file format. Please use CSV or XLSX.');
}

export function matchGuestsToTables(
  parsedGuests: ParsedGuest[],
  tables: Table[]
): MappedGuest[] {
  const tableMap = new Map<string, string>();
  for (const t of tables) {
    tableMap.set(t.name.toLowerCase().trim(), t.id);
    tableMap.set(String(t.number).toLowerCase().trim(), t.id);
  }

  return parsedGuests.map((g) => {
    const rawTable = g.table ? String(g.table).trim() : undefined;
    let tableId: string | null = null;

    if (rawTable) {
      const key = rawTable.toLowerCase().trim();
      tableId = tableMap.get(key) ?? null;
    }

    return {
      name: g.name ? String(g.name).trim() : undefined,
      table_id: tableId,
      rawTable,
    };
  });
}

export function buildGuestPayload(
  mappedGuests: MappedGuest[],
  eventId: string
): GuestInput[] {
  return mappedGuests
    .filter((g) => g.name)
    .map((g) => ({
      name: g.name!,
      table_id: g.table_id,
    }));
}

export function classifyError(err: unknown): ClassifiedError {
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';

  const lower = message.toLowerCase();

  if (lower.includes('unsupported file format')) {
    return {
      message: 'Unsupported file format. Please use CSV or XLSX.',
      type: 'file',
    };
  }

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      type: 'network',
    };
  }

  if (
    lower.includes('permission') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('rls')
  ) {
    return {
      message: 'You do not have permission to perform this action.',
      type: 'permission',
    };
  }

  if (
    lower.includes('invalid') ||
    lower.includes('parse') ||
    lower.includes('format')
  ) {
    return {
      message:
        'The file could not be parsed. Please check the format and try again.',
      type: 'format',
    };
  }

  if (message) {
    return { message, type: 'unknown' };
  }

  return {
    message: 'Unknown error. Please try again.',
    type: 'unknown',
  };
}
