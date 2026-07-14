import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Rsvp } from '@/types';

export function useRsvps(eventId: string | undefined) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data as Rsvp[];
    },
    enabled: !!eventId,
  });
}

export function useCreateRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      guestId,
      status,
      plusOnes = 0,
      message = null,
    }: {
      eventId: string;
      guestId: string;
      status: string;
      plusOnes?: number;
      message?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('rsvps')
        .insert({
          event_id: eventId,
          guest_id: guestId,
          status,
          plus_ones: plusOnes,
          message,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Rsvp;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rsvps', data.event_id] });
    },
  });
}
