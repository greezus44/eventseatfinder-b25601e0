import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Guest, GuestInput, GuestWithTable } from '@/types/guest';

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests').select('*, table:tables(id, name, number)')
        .eq('event_id', eventId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as GuestWithTable[];
    },
    enabled: !!eventId,
  });
}

export function useSearchGuest(eventId: string, name: string) {
  return useQuery({
    queryKey: ['guest', 'search', eventId, name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests').select('*, table:tables(id, name, number)')
        .eq('event_id', eventId).ilike('name', `%${name}%`).maybeSingle();
      if (error) throw error;
      return data as GuestWithTable | null;
    },
    enabled: !!eventId && !!name,
  });
}

export function useCreateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const { data, error } = await supabase.from('guests').insert({ ...input, event_id: eventId }).select().single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guests', eventId] }); },
  });
}

export function useBulkCreateGuests(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: GuestInput[]) => {
      const payload = inputs.map((i) => ({ ...i, event_id: eventId }));
      const { data, error } = await supabase.from('guests').insert(payload).select();
      if (error) throw error;
      return data as Guest[];
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guests', eventId] }); },
  });
}

export function useUpdateGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<GuestInput> & { id: string }) => {
      const { data, error } = await supabase.from('guests').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data as Guest;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guests', eventId] }); },
  });
}

export function useDeleteGuest(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guests', eventId] }); },
  });
}
