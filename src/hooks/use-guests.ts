import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput } from '@/types';

export function useGuests(eventId: string | undefined) {
  return useQuery<Guest[]>({
    queryKey: ['guests', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Guest[];
    },
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ...input }: { eventId: string } & GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .insert({ event_id: eventId, ...input })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}

export function useDeleteGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}

export function useUpdateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId, ...input }: { id: string; eventId: string } & GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .update(input)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}

export function useBulkCreateGuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, guests }: { eventId: string; guests: GuestInput[] }) => {
      const allRows = guests.map((g) => ({ event_id: eventId, ...g }));
      const BATCH_SIZE = 500;
      const results: Guest[] = [];

      for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
        const batch = allRows.slice(i, i + BATCH_SIZE);
        console.log(`Inserting guests batch ${i / BATCH_SIZE + 1} (${batch.length} rows)`);
        const { data, error } = await supabase
          .from('guests')
          .insert(batch)
          .select();
        if (error) {
          console.error('Batch insert error:', error);
          throw error;
        }
        if (data) results.push(...(data as Guest[]));
      }

      console.log(`Total guests inserted: ${results.length}`);
      return results;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}
