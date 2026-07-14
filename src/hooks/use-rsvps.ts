import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RSVP, RSVPStatus } from '@/types/rsvp';

const QUERY_KEY = 'rsvps';

export function useRSVPs(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select(
          'id, event_id, guest_id, status, plus_ones, message, created_at, updated_at, guest:guests(id, name)',
        )
        .eq('event_id', eventId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as unknown as (RSVP & {
        guest: { id: string; name: string };
      })[];
    },
    enabled: !!eventId,
  });
}

export function useRSVPByGuest(eventId: string, guestId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'guest', eventId, guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('guest_id', guestId!)
        .maybeSingle();
      if (error) throw error;
      return data as RSVP | null;
    },
    enabled: !!eventId && !!guestId,
  });
}

export function useUpsertRSVP(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      guest_id,
      status,
      plus_ones,
      message,
    }: {
      guest_id: string;
      status: RSVPStatus;
      plus_ones?: number;
      message?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('rsvps')
        .upsert(
          {
            event_id: eventId,
            guest_id,
            status,
            plus_ones: plus_ones ?? 0,
            message: message ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,guest_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data as RSVP;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, eventId] });
    },
  });
}
