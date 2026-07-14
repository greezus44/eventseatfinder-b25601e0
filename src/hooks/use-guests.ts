import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestWithTable } from '@/types/guest';

const QUERY_KEY = 'guests';

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select(
          'id, event_id, name, table_id, created_at, table:tables(id, name, number)',
        )
        .eq('event_id', eventId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as unknown as GuestWithTable[];
    },
    enabled: !!eventId,
  });
}

export function useCreateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('guests')
        .insert({ event_id: eventId, name })
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, eventId] });
    },
  });
}

export function useBulkCreateGuests(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (names: string[]) => {
      const rows = names.map((name) => ({ event_id: eventId, name }));
      const { data, error } = await supabase
        .from('guests')
        .insert(rows)
        .select('id, name');
      if (error) throw error;
      return data as Pick<Guest, 'id' | 'name'>[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, eventId] });
    },
  });
}

export function useUpdateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      table_id,
    }: {
      id: string;
      name?: string;
      table_id?: string | null;
    }) => {
      const updates: Record<string, string | null> = {};
      if (name !== undefined) updates.name = name;
      if (table_id !== undefined) updates.table_id = table_id;
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, eventId] });
    },
  });
}

export function useDeleteGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, eventId] });
    },
  });
}

export function useGuestSearch(eventId: string, query: string) {
  return useQuery({
    queryKey: ['guest-search', eventId, query],
    queryFn: async () => {
      if (!query.trim()) return [] as GuestWithTable[];

      const { data, error } = await supabase
        .from('guests')
        .select(
          'id, event_id, name, table_id, created_at, table:tables(id, name, number)',
        )
        .eq('event_id', eventId)
        .ilike('name', `%${query.trim()}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      return data as unknown as GuestWithTable[];
    },
    enabled: !!eventId && !!query.trim(),
  });
}

export function useGuestById(eventId: string, guestId: string | null) {
  return useQuery({
    queryKey: ['guest', eventId, guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select(
          'id, event_id, name, table_id, created_at, table:tables(id, name, number)',
        )
        .eq('event_id', eventId)
        .eq('id', guestId!)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as GuestWithTable | null;
    },
    enabled: !!eventId && !!guestId,
  });
}
