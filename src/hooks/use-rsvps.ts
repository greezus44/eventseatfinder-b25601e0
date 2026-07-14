import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Rsvp } from '@/types';

export function useRsvps(eventId: string | undefined) {
  return useQuery<Rsvp[]>({
    queryKey: ['rsvps', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Rsvp[];
    },
  });
}

export function useCreateRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      event_id: string;
      guest_id: string;
      status: string;
      plus_ones?: number;
      message?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('rsvps')
        .insert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Rsvp;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['rsvps', variables.event_id] });
    },
  });
}
