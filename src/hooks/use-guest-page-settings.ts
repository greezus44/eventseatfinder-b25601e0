import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types';

export function useGuestPageSettings(eventId: string) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data as GuestPageSettings | null;
    },
    enabled: !!eventId,
  });
}

export function useGuestPageSettingsBySlug(slug: string) {
  return useQuery({
    queryKey: ['guest-page-settings-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*, event:events(*)')
        .eq('event.slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as (GuestPageSettings & { event: any }) | null;
    },
    enabled: !!slug,
  });
}

export function useUpsertGuestPageSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestPageSettingsInput) => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .upsert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as GuestPageSettings | null;
    },
    onSuccess: (_data, variables) => {
      if (variables.event_id) {
        queryClient.invalidateQueries({
          queryKey: ['guest-page-settings', variables.event_id],
        });
      }
    },
  });
}
