import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Table, TableInput } from '@/types';

export function useTables(eventId: string | undefined) {
  return useQuery<Table[]>({
    queryKey: ['tables', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId)
        .order('number', { ascending: true });
      if (error) throw error;
      return data as Table[];
    },
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ...input }: { eventId: string } & TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .insert({ event_id: eventId, ...input })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tables', variables.eventId] });
    },
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<TableInput>) => {
      const { data, error } = await supabase
        .from('tables')
        .update(input)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Table;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('tables').delete().eq('id', id);
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
    mutationFn: async ({ event_id, tables }: { event_id: string; tables: TableInput[] }) => {
      const rows = tables.map((t) => ({ event_id, ...t }));
      const { data, error } = await supabase.from('tables').insert(rows).select();
      if (error) throw error;
      return data as Table[];
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tables', variables.event_id] });
    },
  });
}
