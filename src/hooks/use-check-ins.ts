import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CheckIn, CheckInInput } from '@/types/check-in';

const CHECKINS_KEY = 'check-ins';

export function useCheckIns(eventId: string | undefined) {
  return useQuery<CheckIn[]>({
    queryKey: [CHECKINS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('event_id', eventId!)
        .order('checked_in_at', { ascending: false });
      if (error) throw error;
      return (data as CheckIn[]) ?? [];
    },
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckInInput) => {
      const payload = { ...input, method: input.method ?? 'manual' };
      const { data, error } = await supabase
        .from('check_ins')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CHECKINS_KEY, data.event_id] });
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
      queryClient.invalidateQueries({ queryKey: [CHECKINS_KEY, variables.eventId] });
    },
  });
}
