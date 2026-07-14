import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput } from '@/types';

export function useGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
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
    mutationFn: async ({ eventId, ...input }: { eventId: string } & GuestInput) => {
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
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
      return { eventId };
    },
    onSuccess: ({ eventId }) => {
      qc.invalidateQueries({ queryKey: ['guests', eventId] });
    },
  });
}

export function useBulkCreateGuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      guests,
    }: {
      eventId: string;
      guests: GuestInput[];
    }) => {
      console.log('[BulkCreateGuests] Starting insert', {
        eventId,
        guestCount: guests.length,
      });
      console.log('[BulkCreateGuests] Sample payload', guests.slice(0, 3));

      const payload = guests.map((g) => ({
        event_id: eventId,
        name: g.name,
        table_id: g.table_id ?? null,
      }));

      console.log('[BulkCreateGuests] Mapped payload sample', payload.slice(0, 3));

      const BATCH_SIZE = 500;
      const results: Guest[] = [];
      const errors: { batch: number; error: string }[] = [];

      for (let i = 0; i < payload.length; i += BATCH_SIZE) {
        const batch = payload.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`[BulkCreateGuests] Inserting batch ${batchNum}`, {
          startIndex: i,
          batchSize: batch.length,
        });

        const { data, error } = await supabase
          .from('guests')
          .insert(batch)
          .select();

        console.log(`[BulkCreateGuests] Batch ${batchNum} response`, {
          insertedCount: data?.length ?? 0,
          error: error ? { message: error.message, code: error.code, details: error.details } : null,
        });

        if (error) {
          console.error(`[BulkCreateGuests] Batch ${batchNum} failed`, error);
          errors.push({ batch: batchNum, error: error.message });
        } else if (data) {
          results.push(...(data as Guest[]));
        }
      }

      if (errors.length > 0 && results.length === 0) {
        throw new Error(
          `Database insert failed: ${errors[0].error}`
        );
      }

      if (errors.length > 0) {
        console.warn(
          `[BulkCreateGuests] Completed with partial errors`,
          { inserted: results.length, errors }
        );
      }

      console.log('[BulkCreateGuests] Insert complete', {
        totalInserted: results.length,
        totalErrors: errors.length,
      });

      return { inserted: results.length, errors };
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['guests', variables.eventId] });
    },
  });
}
