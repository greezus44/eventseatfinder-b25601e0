export type RSVPStatus = 'attending' | 'not_attending' | 'maybe';

export interface RSVP {
  id: string;
  guest_id: string;
  event_id: string;
  status: RSVPStatus;
  plus_ones: number;
  dietary_notes: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RSVPWithGuest extends RSVP {
  guest: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
}
