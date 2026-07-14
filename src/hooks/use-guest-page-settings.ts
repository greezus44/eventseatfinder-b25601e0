import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types';

export function useGuestPageSettings(eventId: string | undefined) {
  return useQuery<GuestPageSettings | null>({
    queryKey: ['guest-page-settings', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data as GuestPageSettings | null;
    },
  });
}

export function useGuestPageSettingsBySlug(slug: string | undefined) {
  return useQuery<(GuestPageSettings & { event: any }) | null>({
    queryKey: ['guest-page-settings-slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_page_settings')
        .select('*, event:events(id, name, slug, date, time, venue, logo_url, cover_url, accent_color)')
        .eq('event.slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as (GuestPageSettings & { event: any }) | null;
    },
  });
}

export function useUpsertGuestPageSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, ...input }: { eventId: string } & GuestPageSettingsInput) => {
      // Check if settings exist
      const { data: existing, error: checkError } = await supabase
        .from('guest_page_settings')
        .select('id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('guest_page_settings')
          .update(input)
          .eq('id', existing.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as GuestPageSettings;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('guest_page_settings')
          .insert({ event_id: eventId, ...input })
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as GuestPageSettings;
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['guest-page-settings', variables.eventId] });
      qc.invalidateQueries({ queryKey: ['guest-page-settings-slug'] });
    },
  });
}
