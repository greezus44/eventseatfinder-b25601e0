import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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
      return (data as GuestWithTable[]) ?? [];
    },
    enabled: !!eventId,
  });
}

export function useSearchGuest(eventId: string, query: string) {
  return useQuery({
    queryKey: ['guest-search', eventId, query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(id, number, name)')
        .eq('event_id', eventId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return (data as GuestWithTable[]) ?? [];
    },
    enabled: !!eventId && !!query && query.length > 0,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const payload = {
        event_id: input.event_id,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        table_id: input.table_id ?? null,
        party_size: input.party_size ?? 1,
        dietary_notes: input.dietary_notes ?? null,
      };
      const { data, error } = await supabase
        .from('guests')
        .insert(payload)
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
      const payload = inputs.map((input) => ({
        event_id: input.event_id,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        table_id: input.table_id ?? null,
        party_size: input.party_size ?? 1,
        dietary_notes: input.dietary_notes ?? null,
      }));
      const { data, error } = await supabase
        .from('guests')
        .insert(payload)
        .select();
      if (error) throw error;
      return data as Guest[];
    },
    onSuccess: (_data, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ['guests', variables[0].event_id],
        });
      }
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      ...fields
    }: {
      id: string;
      eventId: string;
    } & Partial<GuestInput>) => {
      const { data, error } = await supabase
        .from('guests')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.eventId] });
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
