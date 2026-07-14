import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CheckIn } from '@/types';

export function useCheckIns(eventId: string | undefined) {
  return useQuery({
    queryKey: ['check-ins', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!eventId,
  });
}

export function useCreateCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      guestId,
      plusOnesActual = 0,
    }: {
      eventId: string;
      guestId: string;
      plusOnesActual?: number;
    }) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          event_id: eventId,
          guest_id: guestId,
          plus_ones_actual: plusOnesActual,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['check-ins', data.event_id] });
    },
  });
}

export function useDeleteCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('check_ins').delete().eq('id', id);
      if (error) throw error;
      return { eventId };
    },
    onSuccess: ({ eventId }) => {
      qc.invalidateQueries({ queryKey: ['check-ins', eventId] });
    },
  });
}
