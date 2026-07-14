import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Rsvp, RsvpInput } from '@/types';

export function useRsvps(guestId: string) {
  return useQuery({
    queryKey: ['rsvps', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('guest_id', guestId)
        .maybeSingle();
      if (error) throw error;
      return data as Rsvp | null;
    },
    enabled: !!guestId,
  });
}

export function useCreateRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RsvpInput) => {
      const { data, error } = await supabase
        .from('rsvps')
        .insert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Rsvp | null;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', variables.guest_id] });
    },
  });
}
