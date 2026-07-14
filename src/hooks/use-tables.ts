import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table, TableInput } from '@/types';

export function useTables(eventId: string | undefined) {
  return useQuery({
    queryKey: ['tables', eventId],
    queryFn: async () => {
      if (!eventId) return [];
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

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { eventId: string } & TableInput) => {
      const { eventId, ...input } = params;
      const { data, error } = await supabase
        .from('tables')
        .insert({ event_id: eventId, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tables', data.event_id] });
    },
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<TableInput> & { eventId?: string }) => {
      const { id, eventId, ...input } = params;
      const { data, error } = await supabase
        .from('tables')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data: data as Table, eventId };
    },
    onSuccess: (_data, variables) => {
      if (variables.eventId) {
        qc.invalidateQueries({ queryKey: ['tables', variables.eventId] });
      }
    },
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tables', variables.eventId] });
    },
  });
}

export function useBulkCreateTables() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      event_id: string;
      tables: TableInput[];
    }) => {
      const payload = params.tables.map((t) => ({
        event_id: params.event_id,
        ...t,
      }));
      const { data, error } = await supabase
        .from('tables')
        .insert(payload)
        .select();
      if (error) throw error;
      return data as Table[];
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tables', variables.event_id] });
    },
  });
}
