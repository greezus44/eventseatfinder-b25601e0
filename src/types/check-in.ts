export interface CheckIn {
  id: string;
  guest_id: string;
  event_id: string;
  checked_in: boolean;
  checked_in_at: string | null;
  plus_ones_checked_in: number;
  created_at: string;
  updated_at: string;
}
