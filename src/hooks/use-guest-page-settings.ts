import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  GuestPageSettings,
  GuestPageSettingsInput,
} from '@/types/guest-page-settings';

const SETTINGS_KEY = 'guest-page-settings';

export function useGuestPageSettings(eventId: string) {
  return useQuery({
    queryKey: [SETTINGS_KEY, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return (data as GuestPageSettings | null) ?? null;
    },
    enabled: !!eventId,
  });
}

export function useGuestPageSettingsBySlug(slug: string) {
  return useQuery({
    queryKey: [SETTINGS_KEY, 'slug', slug],
    queryFn: async () => {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (eventError) throw eventError;
      if (!event) return null;

      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', event.id)
        .maybeSingle();
      if (error) throw error;
      return (data as GuestPageSettings | null) ?? null;
    },
    enabled: !!slug,
  });
}

export function useUpsertGuestPageSettings(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestPageSettingsInput) => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .upsert(
          { ...input, event_id: eventId, updated_at: new Date().toISOString() },
          { onConflict: 'event_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data as GuestPageSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'slug'] });
    },
  });
}
