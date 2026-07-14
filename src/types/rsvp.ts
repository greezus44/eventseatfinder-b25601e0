export interface RSVP {
  id: string;
  event_id: string;
  guest_id: string;
  status: 'yes' | 'no' | 'maybe';
  plus_ones: number;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RSVPInput {
  guest_id: string;
  status: 'yes' | 'no' | 'maybe';
  plus_ones?: number;
  message?: string | null;
}
