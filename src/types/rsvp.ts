export type RSVPStatus = 'attending' | 'not_attending' | 'maybe';

export interface RSVP {
  id: string;
  event_id: string;
  guest_id: string;
  status: RSVPStatus;
  plus_ones: number;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RSVPInput {
  event_id: string;
  guest_id: string;
  status: RSVPStatus;
  plus_ones?: number;
  message?: string | null;
}
