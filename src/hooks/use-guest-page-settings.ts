import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  GuestPageSettings,
  GuestPageSettingsInput,
} from '@/types/guest-page-settings';

export function useGuestPageSettings(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as GuestPageSettings | null;
    },
  });
}

export function useGuestPageSettingsBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['guest-page-settings', 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*, event:events!inner(slug)')
        .eq('event.slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data as (GuestPageSettings & { event: { slug: string } }) | null;
    },
  });
}

export function useUpsertGuestPageSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestPageSettingsInput) => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .upsert(input, { onConflict: 'event_id' })
        .select()
        .single();
      if (error) throw error;
      return data as GuestPageSettings;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guest-page-settings', data.event_id] });
    },
  });
}
