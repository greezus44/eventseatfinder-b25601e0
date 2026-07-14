import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Table, TableInput } from '@/types';

export function useTables(eventId: string) {
  return useQuery({
    queryKey: ['tables', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Table[];
    },
    enabled: !!eventId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      ...input
    }: { eventId: string } & TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .insert({ event_id: eventId, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.eventId] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      id,
      ...input
    }: { eventId: string; id: string } & TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.eventId] });
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

export function useBulkCreateTables() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      event_id,
      tables,
    }: {
      event_id: string;
      tables: TableInput[];
    }) => {
      const payload = tables.map((t) => ({ event_id, ...t }));
      const { data, error } = await supabase
        .from('tables')
        .insert(payload)
        .select();
      if (error) throw error;
      return data as Table[];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.event_id] });
    },
  });
}
