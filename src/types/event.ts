export interface Event {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  logo_url: string | null;
  cover_url: string | null;
  accent_color: string | null;
  invitation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  name: string;
  date?: string | null;
  time?: string | null;
  venue?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  accent_color?: string | null;
  invitation_enabled?: boolean;
}
