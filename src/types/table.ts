export interface Table {
  id: string;
  event_id: string;
  name: string;
  number: number;
  capacity: number;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
}

export interface TableInput {
  name: string;
  number: number;
  capacity: number;
  position_x?: number | null;
  position_y?: number | null;
}
