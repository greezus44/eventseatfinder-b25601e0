import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestWithTable, GuestInput } from '@/types/guest';

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id,name,number)')
        .eq('event_id', eventId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as GuestWithTable[];
    },
    enabled: !!eventId,
  });
}

export function useGuestById(guestId: string) {
  return useQuery({
    queryKey: ['guest', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id,name,number)')
        .eq('id', guestId)
        .maybeSingle();
      if (error) throw error;
      return data as GuestWithTable | null;
    },
    enabled: !!guestId,
  });
}

export function useGuestSearch(eventId: string, query: string) {
  return useQuery({
    queryKey: ['guest-search', eventId, query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id,name,number)')
        .eq('event_id', eventId)
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as GuestWithTable[];
    },
    enabled: !!eventId && !!query,
  });
}

export function useCreateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .insert({ ...input, event_id: eventId })
        .select('*, table:tables(id,name,number)')
        .single();
      if (error) throw error;
      return data as GuestWithTable;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests', eventId] });
    },
  });
}

export function useBulkCreateGuests(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (names: string[]) => {
      const rows = names.map((name) => ({ name, event_id: eventId }));
      const { data, error } = await supabase
        .from('guests')
        .insert(rows)
        .select('*, table:tables(id,name,number)');
      if (error) throw error;
      return data as GuestWithTable[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests', eventId] });
    },
  });
}

export function useUpdateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: GuestInput & { id: string }) => {
      const { data, error } = await supabase
        .from('guests')
        .update(input)
        .eq('id', id)
        .select('*, table:tables(id,name,number)')
        .single();
      if (error) throw error;
      return data as GuestWithTable;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests', eventId] });
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
      qc.invalidateQueries({ queryKey: ['guests', eventId] });
    },
  });
}
