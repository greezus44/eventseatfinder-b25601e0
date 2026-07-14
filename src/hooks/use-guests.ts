import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Guest, GuestInput } from '@/types';

export function useGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!eventId,
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { eventId: string } & GuestInput) => {
      const { eventId, ...input } = params;
      const { data, error } = await supabase
        .from('guests')
        .insert({ event_id: eventId, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['guests', data.event_id] });
    },
  });
}

export function useDeleteGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}

export function useBulkCreateGuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      guests: GuestInput[];
    }) => {
      const batchSize = 500;
      const results: Guest[] = [];
      for (let i = 0; i < params.guests.length; i += batchSize) {
        const batch = params.guests.slice(i, i + batchSize);
        const payload = batch.map((g) => ({
          event_id: params.eventId,
          ...g,
        }));
        console.log(
          `Inserting guests batch ${Math.floor(i / batchSize) + 1}: ${batch.length} guests`
        );
        const { data, error } = await supabase
          .from('guests')
          .insert(payload)
          .select();
        if (error) throw error;
        if (data) results.push(...(data as Guest[]));
      }
      return results;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}
