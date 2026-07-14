import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Table, TableInput } from '@/types/table';

export function useTables(eventId: string | undefined) {
  return useQuery({
    queryKey: ['tables', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId!)
        .order('number', { ascending: true });
      if (error) throw error;
      return data as Table[];
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.event_id] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('tables').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.eventId] });
    },
  });
}
