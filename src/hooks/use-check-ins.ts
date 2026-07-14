import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CheckIn } from '@/types/check-in';

const QK = 'check-ins';

export function useCheckIns(eventId: string) {
  return useQuery({
    queryKey: [QK, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('event_id', eventId);
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!eventId,
  });
}

export function useToggleCheckIn(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      guest_id,
      check_in,
      plus_ones_actual,
    }: {
      guest_id: string;
      check_in: boolean;
      plus_ones_actual?: number;
    }) => {
      if (check_in) {
        const { data, error } = await supabase
          .from('check_ins')
          .upsert(
            {
              event_id: eventId,
              guest_id,
              plus_ones_actual: plus_ones_actual ?? 0,
              checked_in_at: new Date().toISOString(),
            },
            { onConflict: 'event_id,guest_id' },
          )
          .select()
          .single();
        if (error) throw error;
        return data as CheckIn;
      } else {
        const { error } = await supabase
          .from('check_ins')
          .delete()
          .eq('event_id', eventId)
          .eq('guest_id', guest_id);
        if (error) throw error;
        return null;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, eventId] });
    },
  });
}

export function useUpdateCheckInPlusOnes(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      guest_id,
      plus_ones_actual,
    }: {
      guest_id: string;
      plus_ones_actual: number;
    }) => {
      const { error } = await supabase
        .from('check_ins')
        .update({ plus_ones_actual })
        .eq('event_id', eventId)
        .eq('guest_id', guest_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, eventId] });
    },
  });
}
