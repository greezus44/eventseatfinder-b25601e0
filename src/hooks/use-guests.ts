import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput } from '@/types';

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!eventId,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      ...input
    }: { eventId: string } & GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .insert({ event_id: eventId, ...input })
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

export function useBulkCreateGuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      guests,
    }: {
      eventId: string;
      guests: GuestInput[];
    }) => {
      const BATCH_SIZE = 500;
      const results: Guest[] = [];
      for (let i = 0; i < guests.length; i += BATCH_SIZE) {
        const batch = guests.slice(i, i + BATCH_SIZE).map((g) => ({
          event_id: eventId,
          ...g,
        }));
        console.log(
          `Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} guests)`
        );
        const { data, error } = await supabase
          .from('guests')
          .insert(batch)
          .select();
        if (error) throw error;
        if (data) results.push(...(data as Guest[]));
      }
      return results;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}
