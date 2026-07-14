import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput, GuestWithTable } from '@/types/guest';

export function useGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guests', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GuestWithTable[];
    },
  });
}

export function useSearchGuest(eventId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['guests', eventId, 'search', query],
    enabled: !!eventId && query.trim().length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId!)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GuestWithTable[];
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.event_id] });
    },
  });
}

export function useBulkCreateGuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: GuestInput[]) => {
      const { data, error } = await supabase
        .from('guests')
        .insert(inputs)
        .select();
      if (error) throw error;
      return data as Guest[];
    },
    onSuccess: (_data, variables) => {
      const eventId = variables[0]?.event_id;
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      }
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: GuestInput & { id: string }) => {
      const { data, error } = await supabase
        .from('guests')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.event_id] });
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
      queryClient.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}
