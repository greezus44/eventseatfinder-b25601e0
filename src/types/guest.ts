export interface Guest { id: string; event_id: string; name: string; table_id: string | null; created_at: string; }
export interface GuestInput { name: string; table_id?: string | null; }
export interface GuestWithTable extends Guest { table: { id: string; name: string; number: number } | null; }
