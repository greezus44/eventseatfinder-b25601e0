export interface RSVP {
  id: string;
  guest_id: string;
  status: 'pending' | 'attending' | 'not_attending';
  party_size: number;
  dietary_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RSVPInput {
  guest_id: string;
  status: 'pending' | 'attending' | 'not_attending';
  party_size?: number;
  dietary_notes?: string | null;
}
