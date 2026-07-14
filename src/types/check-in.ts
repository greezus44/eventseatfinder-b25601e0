export interface CheckIn {
  id: string;
  event_id: string;
  guest_id: string;
  checked_in_at: string;
  plus_ones_actual: number;
}

export interface CheckInInput {
  guest_id: string;
  check_in: boolean;
  plus_ones_actual?: number;
}
