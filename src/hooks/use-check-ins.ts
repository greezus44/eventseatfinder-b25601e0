import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CheckIn, CheckInInput } from '@/types/check-in';

export function useCheckIns(eventId: string) {
  return useQuery({
    queryKey: ['check-ins', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*, guest:guests(id, name)')
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });
      if (error) throw error;
      return data as (CheckIn & { guest: { id: string; name: string } })[];
    },
    enabled: !!eventId,
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckInInput) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          guest_id: input.guest_id,
          event_id: input.event_id,
          method: input.method ?? 'manual',
        })
        .select()
        .single();
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', variables.event_id] });
    },
  });
}

export function useDeleteCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('check_ins').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', variables.eventId] });
    },
  });
}
