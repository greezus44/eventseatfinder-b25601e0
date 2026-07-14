import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types';

export function useGuestPageSettings(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
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
      if (!slug) throw new Error('Slug is required');
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select(
          '*, event:events(id, name, slug, date, time, venue, logo_url, cover_url, accent_color)'
        )
        .eq('event.slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as (GuestPageSettings & {
        event: {
          id: string;
          name: string;
          slug: string;
          date: string | null;
          time: string | null;
          venue: string | null;
          logo_url: string | null;
          cover_url: string | null;
          accent_color: string | null;
        };
      }) | null;
    },
    enabled: !!slug,
  });
}

export function useUpsertGuestPageSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      ...input
    }: { eventId: string } & GuestPageSettingsInput) => {
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
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['guest-page-settings', variables.eventId] });
      qc.invalidateQueries({ queryKey: ['guest-page-settings-by-slug'] });
    },
  });
}
