export interface CheckIn {
  id: string;
  guest_id: string;
  event_id: string;
  checked_in_at: string;
  method: 'manual' | 'qr' | 'self';
}

export interface CheckInInput {
  guest_id: string;
  event_id: string;
  method?: 'manual' | 'qr' | 'self';
}
