import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput, GuestWithTable } from '@/types/guest';

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as GuestWithTable[];
    },
    enabled: !!eventId,
  });
}

export function useSearchGuest(eventId: string, query: string) {
  return useQuery({
    queryKey: ['guests', eventId, 'search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as GuestWithTable[];
    },
    enabled: !!eventId && !!query,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .insert({
          event_id: input.event_id,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          table_id: input.table_id ?? null,
          party_size: input.party_size ?? 1,
          dietary_notes: input.dietary_notes ?? null,
        })
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
      const { data, error } = await supabase.from('guests').insert(inputs).select();
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
        .update({
          event_id: input.event_id,
          name: input.name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          table_id: input.table_id ?? null,
          party_size: input.party_size ?? 1,
          dietary_notes: input.dietary_notes ?? null,
        })
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
