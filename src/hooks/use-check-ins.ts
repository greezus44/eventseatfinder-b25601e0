import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CheckIn } from '@/types';

export function useCheckIns(guestId: string) {
  return useQuery({
    queryKey: ['check-ins', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('guest_id', guestId)
        .maybeSingle();
      if (error) throw error;
      return data as CheckIn | null;
    },
    enabled: !!guestId,
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guestId: string) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({ guest_id: guestId })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as CheckIn | null;
    },
    onSuccess: (_data, guestId) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', guestId] });
    },
  });
}

export function useDeleteCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('guest_id', guestId);
      if (error) throw error;
    },
    onSuccess: (_data, guestId) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', guestId] });
    },
  });
}
