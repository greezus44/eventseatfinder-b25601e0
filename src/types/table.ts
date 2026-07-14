export interface Table {
  id: string;
  event_id: string;
  name: string;
  number: number;
  capacity: number;
  position_x: number;
  position_y: number;
  created_at: string;
}

export interface TableInput {
  event_id: string;
  name: string;
  number: number;
  capacity: number;
  position_x: number;
  position_y: number;
}
