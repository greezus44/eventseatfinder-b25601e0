import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { GuestInput, Table } from '@/types';

export interface ParsedGuest {
  name: string;
  table: string;
  [key: string]: unknown;
}

export interface GuestWithTable extends GuestInput {
  table_name: string;
  raw_table: string;
}

export interface ImportSummary {
  total: number;
  matched: number;
  unmatched: number;
  guests: GuestWithTable[];
  unmatchedTables: string[];
  errors: string[];
}

export async function parseFile(file: File): Promise<ParsedGuest[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise<ParsedGuest[]>((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data.map((row: Record<string, unknown>) => {
            const obj = row as Record<string, string>;
            const name = String(obj.name || obj.Name || obj.guest || obj.Guest || obj['Guest Name'] || obj['Full Name'] || '').trim();
            const table = String(obj.table || obj.Table || obj['Table Number'] || obj.table_number || obj['Table Name'] || obj['Assigned Table'] || '').trim();
            return { name, table, ...obj } as ParsedGuest;
          });
          resolve(rows.filter((r) => r.name));
        },
        error: (err: Error) => reject(err),
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    return json.map((row) => {
      const obj = row as Record<string, string>;
      const name = String(obj.name || obj.Name || obj.guest || obj.Guest || obj['Guest Name'] || obj['Full Name'] || '').trim();
      const table = String(obj.table || obj.Table || obj['Table Number'] || obj.table_number || obj['Table Name'] || obj['Assigned Table'] || '').trim();
      return { name, table, ...obj } as ParsedGuest;
    }).filter((r) => r.name);
  }

  if (ext === 'pdf') {
    // Best-effort PDF text extraction using browser APIs
    // PDFs are complex; we attempt basic text extraction
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let textContent = '';

      // Simple PDF text extraction: look for text between BT and ET markers
      const decoder = new TextDecoder('latin1');
      const raw = decoder.decode(bytes);

      // Extract text from PDF streams (basic approach)
      const textMatches = raw.match(/\(([^)]+)\)/g);
      if (textMatches) {
        textContent = textMatches.map(m => m.slice(1, -1)).join('\n');
      }

      // Parse lines as potential guest entries
      const lines = textContent.split(/[\n\r]+/).filter(l => l.trim());

      // Try to detect name and table patterns
      const guests: ParsedGuest[] = [];
      for (const line of lines) {
        // Look for patterns like "Name - Table 1" or "Name, Table 1" or "Name | Table 1"
        const match = line.match(/^(.+?)\s*[-,|]\s*(?:Table\s*)?(\d+|[A-Za-z\s]+)$/i);
        if (match) {
          const name = match[1].trim();
          const table = match[2].trim();
          if (name && name.length > 1) {
            guests.push({ name, table });
          }
        } else if (line.trim().length > 1 && !line.includes('%') && !line.includes('/')) {
          // Just a name without table
          guests.push({ name: line.trim(), table: '' });
        }
      }

      if (guests.length === 0) {
        throw new Error('Could not extract guest data from PDF. Please ensure the PDF contains a table with guest names and table numbers, or use CSV/XLSX format instead.');
      }

      return guests;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Could not extract')) {
        throw err;
      }
      throw new Error('Failed to read PDF file. Please try CSV or XLSX format for better results.');
    }
  }

  throw new Error('Unsupported file format. Please upload CSV, XLSX, XLS, or PDF.');
}

export function matchGuestsToTables(parsed: ParsedGuest[], tables: Table[]): GuestWithTable[] {
  const tableMap = new Map<string, Table>();
  for (const t of tables) {
    tableMap.set(t.name.toLowerCase().trim(), t);
    tableMap.set(String(t.number).toLowerCase().trim(), t);
    tableMap.set(`table ${t.number}`.toLowerCase().trim(), t);
    tableMap.set(`table ${t.name}`.toLowerCase().trim(), t);
  }

  return parsed.map((guest) => {
    const tableRef = String(guest.table || '').trim();
    let matchedTable: Table | undefined;

    if (tableRef) {
      const normalized = tableRef.toLowerCase().trim();
      matchedTable = tableMap.get(normalized);

      if (!matchedTable) {
        const asNum = parseInt(tableRef, 10);
        if (!isNaN(asNum)) {
          matchedTable = tableMap.get(String(asNum));
        }
      }

      if (!matchedTable) {
        const tableMatch = normalized.match(/^table\s*(\d+)$/);
        if (tableMatch) {
          const num = parseInt(tableMatch[1], 10);
          matchedTable = tableMap.get(String(num));
        }
      }
    }

    return {
      name: guest.name,
      table_id: matchedTable ? matchedTable.id : null,
      table_name: matchedTable ? matchedTable.name : '',
      raw_table: tableRef,
    };
  });
}

export function buildGuestPayload(mapped: GuestWithTable[], eventId: string) {
  return mapped.map((g) => ({
    event_id: eventId,
    name: g.name,
    table_id: g.table_id,
  }));
}

export function classifyError(err: unknown): { message: string; type: string } {
  if (!err) {
    return { message: 'An unexpected error occurred. Please try again.', type: 'unknown' };
  }

  if (err instanceof Error) {
    const msg = err.message;

    if (msg.includes('network') || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('failed to fetch')) {
      return { message: 'Network error. Please check your connection and try again.', type: 'network' };
    }

    if (msg.includes('Unsupported file format')) {
      return { message: msg, type: 'file_format' };
    }

    if (msg.includes('Could not extract') || msg.includes('Failed to read')) {
      return { message: msg, type: 'parse_error' };
    }

    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('rls') || msg.toLowerCase().includes('policy')) {
      return { message: 'Permission denied. You may not have access to this event.', type: 'permission' };
    }

    if (msg.toLowerCase().includes('duplicate')) {
      return { message: 'Duplicate guest detected. Some guests may already exist.', type: 'duplicate' };
    }

    return { message: msg, type: 'error' };
  }

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const message = String(e.message || e.error || e.detail || '');
    if (message) {
      return { message, type: String(e.code || 'error') };
    }
  }

  if (typeof err === 'string' && err.trim()) {
    return { message: err, type: 'string' };
  }

  return { message: 'An unexpected error occurred. Please try again.', type: 'unknown' };
}
