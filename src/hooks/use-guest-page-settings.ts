import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { GuestPageSettings, GuestPageSettingsInput, Event } from '@/types';

export type GuestPageSettingsWithEvent = GuestPageSettings & {
  event: Pick<
    Event,
    | 'id'
    | 'name'
    | 'slug'
    | 'date'
    | 'time'
    | 'venue'
    | 'logo_url'
    | 'cover_url'
    | 'accent_color'
  >;
};

export function useGuestPageSettings(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    queryFn: async () => {
      if (!eventId) return null;
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

export function useGuestPageSettingsBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['guest-page-settings-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select(
          '*, event:events(id, name, slug, date, time, venue, logo_url, cover_url, accent_color)'
        )
        .eq('event.slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as GuestPageSettingsWithEvent | null;
    },
    enabled: !!slug,
  });
}

export function useUpsertGuestPageSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { eventId: string } & GuestPageSettingsInput) => {
      const { eventId, ...input } = params;

      const { data: existing } = await supabase
        .from('guest_page_settings')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('guest_page_settings')
          .update(input)
          .eq('event_id', eventId)
          .select()
          .single();
        if (error) throw error;
        return data as GuestPageSettings;
      } else {
        const { data, error } = await supabase
          .from('guest_page_settings')
          .insert({ event_id: eventId, ...input })
          .select()
          .single();
        if (error) throw error;
        return data as GuestPageSettings;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: ['guest-page-settings', data.event_id],
      });
    },
  });
}
