import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RSVP, RSVPInput } from '@/types/rsvp';

export function useRSVPs(eventId: string | undefined) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*, guest:guests(event_id)')
        .eq('guest.event_id', eventId!);
      if (error) throw error;
      return data as (RSVP & { guest: { event_id: string } })[];
    },
  });
}

export function useRSVPByGuest(guestId: string | undefined) {
  return useQuery({
    queryKey: ['rsvps', 'guest', guestId],
    enabled: !!guestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('guest_id', guestId!)
        .maybeSingle();
      if (error) throw error;
      return data as RSVP | null;
    },
  });
}

export function useUpsertRSVP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RSVPInput) => {
      const { data, error } = await supabase
        .from('rsvps')
        .upsert(input, { onConflict: 'guest_id' })
        .select()
        .single();
      if (error) throw error;
      return data as RSVP;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', 'guest', data.guest_id] });
    },
  });
}
