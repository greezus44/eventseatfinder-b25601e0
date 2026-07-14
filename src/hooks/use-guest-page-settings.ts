import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types/guest-page-settings';

const SETTINGS_KEY = 'guest-page-settings';

export function useGuestPageSettings(eventId: string | undefined) {
  return useQuery<GuestPageSettings | null>({
    queryKey: [SETTINGS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', eventId!)
        .maybeSingle();
      if (error) throw error;
      return (data as GuestPageSettings) ?? null;
    },
  });
}

export function useGuestPageSettingsBySlug(slug: string | undefined) {
  return useQuery<GuestPageSettings | null>({
    queryKey: [SETTINGS_KEY, 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug!)
        .single();
      if (eventError) throw eventError;

      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', (eventData as { id: string }).id)
        .maybeSingle();
      if (error) throw error;
      return (data as GuestPageSettings) ?? null;
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
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, data.event_id] });
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
  });
}
