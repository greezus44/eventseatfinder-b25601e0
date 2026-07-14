import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Table, TableInput } from '@/types/table';

const TABLES_KEY = 'tables';

export function useTables(eventId: string) {
  return useQuery({
    queryKey: [TABLES_KEY, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId)
        .order('number', { ascending: true });
      if (error) throw error;
      return data as Table[];
    },
    enabled: !!eventId,
  });
}

export function useCreateTable(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .insert({ ...input, event_id: eventId })
        .select()
        .single();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, eventId] });
    },
  });
}

export function useUpdateTable(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TableInput & { id: string }) => {
      const { data, error } = await supabase
        .from('tables')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, eventId] });
    },
  });
}

export function useUpdateTablePosition(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      position_x,
      position_y,
    }: {
      id: string;
      position_x: number;
      position_y: number;
    }) => {
      const { error } = await supabase
        .from('tables')
        .update({ position_x, position_y })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, eventId] });
    },
  });
}

export function useDeleteTable(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tables').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, eventId] });
    },
  });
}
