import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Rsvp } from '@/types';

export function useRsvps(eventId: string | undefined) {
  return useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Rsvp[];
    },
    enabled: !!eventId,
  });
}

export function useCreateRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      guestId: string;
      status: string;
      plusOnes: number;
      message?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('rsvps')
        .insert({
          event_id: params.eventId,
          guest_id: params.guestId,
          status: params.status,
          plus_ones: params.plusOnes,
          message: params.message ?? null,
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
