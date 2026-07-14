import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput, GuestWithTable } from '@/types/guest';

const GUESTS_KEY = 'guests';

export function useGuests(eventId: string | undefined) {
  return useQuery<GuestWithTable[]>({
    queryKey: [GUESTS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as GuestWithTable[]) ?? [];
    },
  });
}

export function useSearchGuest(eventId: string | undefined, query: string) {
  return useQuery<GuestWithTable[]>({
    queryKey: [GUESTS_KEY, eventId, 'search', query],
    enabled: !!eventId && query.trim().length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId!)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data as GuestWithTable[]) ?? [];
    },
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, data.event_id] });
    },
  });
}

export function useBulkCreateGuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: GuestInput[]) => {
      if (inputs.length === 0) return [];
      const { data, error } = await supabase
        .from('guests')
        .insert(inputs)
        .select();
      if (error) throw error;
      return (data as Guest[]) ?? [];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, data[0].event_id] });
      }
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<GuestInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('guests')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, data.event_id] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, variables.eventId] });
    },
  });
}
