export interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  table_id: string | null;
  party_size: number;
  dietary_notes: string | null;
  created_at: string;
}

export interface GuestInput {
  event_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  table_id?: string | null;
  party_size?: number;
  dietary_notes?: string | null;
}

export interface GuestWithTable extends Guest {
  table: { id: string; number: string; name: string } | null;
}
