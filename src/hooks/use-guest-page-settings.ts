import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types/guest-page-settings';

export function useGuestPageSettings(eventId: string) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from('guest_page_settings').select('*').eq('event_id', eventId).maybeSingle();
      if (error) throw error;
      return data as GuestPageSettings | null;
    },
    enabled: !!eventId,
  });
}

export function useGuestPageSettingsBySlug(slug: string) {
  return useQuery({
    queryKey: ['guest-page-settings', 'slug', slug],
    queryFn: async () => {
      const { data: event, error: eventError } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle();
      if (eventError) throw eventError;
      if (!event) return null;
      const { data, error } = await supabase.from('guest_page_settings').select('*').eq('event_id', event.id).maybeSingle();
      if (error) throw error;
      return data as GuestPageSettings | null;
    },
    enabled: !!slug,
  });
}

export function useUpsertGuestPageSettings(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestPageSettingsInput) => {
      const { data, error } = await supabase.from('guest_page_settings').upsert({ ...input, event_id: eventId }).select().single();
      if (error) throw error;
      return data as GuestPageSettings;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['guest-page-settings', eventId] }); },
  });
}
