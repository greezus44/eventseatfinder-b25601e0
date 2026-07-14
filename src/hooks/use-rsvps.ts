import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RSVP, RSVPInput } from '@/types/rsvp';

export function useRSVPs(eventId: string) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RSVP[];
    },
    enabled: !!eventId,
  });
}

export function useRSVPByGuest(eventId: string, guestId: string) {
  return useQuery({
    queryKey: ['rsvp', eventId, guestId],
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
    mutationFn: async (input: RSVPInput) => {
      const { data, error } = await supabase
        .from('rsvps')
        .upsert({ ...input, event_id: eventId })
        .select()
        .single();
      if (error) throw error;
      return data as RSVP;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rsvps', eventId] });
    },
  });
}
