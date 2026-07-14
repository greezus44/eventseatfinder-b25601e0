import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types/guest-page-settings';

export function useGuestPageSettings(eventId: string) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', eventId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as GuestPageSettings | null;
    },
    enabled: !!eventId,
  });
}

export function useGuestPageSettingsBySlug(slug: string) {
  return useQuery({
    queryKey: ['guest-page-settings-by-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          'id, name, slug, date, time, venue, logo_url, cover_url, accent_color, invitation_enabled, guest_page_settings(*)',
        )
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as unknown as {
        id: string;
        name: string;
        slug: string;
        date: string | null;
        time: string | null;
        venue: string | null;
        logo_url: string | null;
        cover_url: string | null;
        accent_color: string | null;
        invitation_enabled: boolean;
        guest_page_settings: GuestPageSettings | null;
      };
    },
    enabled: !!slug,
    staleTime: 0,
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
        .single();
      if (error) throw error;
      return data as GuestPageSettings;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guest-page-settings', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['guest-page-settings-by-slug'] });
    },
  });
}
