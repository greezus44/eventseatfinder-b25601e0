export interface Guest {
  id: string;
  event_id: string;
  name: string;
  table_id: string | null;
  created_at: string;
}

export interface GuestInput {
  name: string;
  table_id?: string | null;
}

export interface GuestWithTable extends Guest {
  table: Pick<Table, 'id' | 'name' | 'number'> | null;
}

import type { Table } from './table';
