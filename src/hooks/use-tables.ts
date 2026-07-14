import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Table, TableInput } from '@/types/table';

const TABLES_KEY = 'tables';

export function useTables(eventId: string | undefined) {
  return useQuery<Table[]>({
    queryKey: [TABLES_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId!)
        .order('number', { ascending: true });
      if (error) throw error;
      return (data as Table[]) ?? [];
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['guests', data.event_id] });
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
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}
