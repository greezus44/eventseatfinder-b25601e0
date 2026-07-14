import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CheckIn } from '@/types';

export function useCheckIns(eventId: string | undefined) {
  return useQuery({
    queryKey: ['check-ins', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!eventId,
  });
}

export function useCreateCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      guestId: string;
      plusOnesActual: number;
    }) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          event_id: params.eventId,
          guest_id: params.guestId,
          plus_ones_actual: params.plusOnesActual,
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
    mutationFn: async (params: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['check-ins', variables.eventId] });
    },
  });
}
