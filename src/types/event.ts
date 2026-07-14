export interface Event {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  date: string;
  time: string;
  venue: string;
  logo_url: string | null;
  cover_url: string | null;
  accent_color: string | null;
  invitation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  name: string;
  slug: string;
  date: string;
  time: string;
  venue: string;
  logo_url?: string | null;
  cover_url?: string | null;
  accent_color?: string | null;
  invitation_enabled?: boolean;
}
