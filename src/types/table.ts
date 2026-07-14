export interface Table {
  id: string;
  event_id: string;
  number: string;
  name: string;
  capacity: number;
  created_at: string;
}

export interface TableInput {
  event_id: string;
  number: string;
  name?: string;
  capacity?: number;
}
