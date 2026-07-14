import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RSVP, RSVPInput } from '@/types/rsvp';

export function useRSVPs(eventId: string) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*, guest:guests(id, name, event_id)')
        .eq('guest.event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as (RSVP & { guest: { id: string; name: string; event_id: string } })[];
    },
    enabled: !!eventId,
  });
}

export function useRSVPByGuest(guestId: string) {
  return useQuery({
    queryKey: ['rsvps', 'guest', guestId],
    queryFn: async () => {
      const { data, error } = await supabase.from('rsvps').select('*').eq('guest_id', guestId).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as RSVP | null;
    },
    enabled: !!guestId,
  });
}

export function useUpsertRSVP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RSVPInput) => {
      const { data, error } = await supabase.from('rsvps').upsert(input).select().single();
      if (error) throw error;
      return data as RSVP;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', 'guest', variables.guest_id] });
    },
  });
}
