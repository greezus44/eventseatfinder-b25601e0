import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RSVP, RSVPStatus, RSVPWithGuest } from '@/types/rsvp';

export function useRSVPs(eventId: string) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*, guest:guests(id,name)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RSVPWithGuest[];
    },
    enabled: !!eventId,
  });
}

export function useRSVPByGuest(eventId: string, guestId: string) {
  return useQuery({
    queryKey: ['rsvp-by-guest', eventId, guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('guest_id', guestId)
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
      plus_ones: number;
      message?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('rsvps')
        .upsert(
          { event_id: eventId, guest_id, status, plus_ones, message },
          { onConflict: 'event_id,guest_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data as RSVP;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsvps', eventId] });
      qc.invalidateQueries({ queryKey: ['rsvp-by-guest', eventId] });
    },
  });
}
