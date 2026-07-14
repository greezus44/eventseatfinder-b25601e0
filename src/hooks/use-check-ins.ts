import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CheckIn } from '@/types';

export function useCheckIns(eventId: string | undefined) {
  return useQuery<CheckIn[]>({
    queryKey: ['check-ins', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });
      if (error) throw error;
      return data as CheckIn[];
    },
  });
}

export function useCreateCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      event_id: string;
      guest_id: string;
      plus_ones?: number;
    }) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['check-ins', variables.event_id] });
    },
  });
}

export function useDeleteCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('check_ins').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['check-ins', variables.eventId] });
    },
  });
}
