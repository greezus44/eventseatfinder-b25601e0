import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestWithTable, GuestInput } from '@/types/guest';

const GUESTS_KEY = 'guests';

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: [GUESTS_KEY, eventId],
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
    queryKey: [GUESTS_KEY, 'id', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id,name,number)')
        .eq('id', guestId)
        .maybeSingle();
      if (error) throw error;
      return (data as GuestWithTable | null) ?? null;
    },
    enabled: !!guestId,
  });
}

export function useGuestSearch(eventId: string, query: string) {
  return useQuery({
    queryKey: [GUESTS_KEY, 'search', eventId, query],
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
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, eventId] });
    },
  });
}

export function useBulkCreateGuests(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: GuestInput[]) => {
      const rows = inputs.map((input) => ({ ...input, event_id: eventId }));
      const { data, error } = await supabase
        .from('guests')
        .insert(rows)
        .select('*, table:tables(id,name,number)');
      if (error) throw error;
      return data as GuestWithTable[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, eventId] });
    },
  });
}

export function useUpdateGuest(eventId: string) {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, eventId] });
    },
  });
}

export function useDeleteGuest(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, eventId] });
    },
  });
}
