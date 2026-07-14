import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event, GuestPageSettings, GuestPageSettingsInput } from '@/types'

const SETTINGS_KEY = 'guest-page-settings'

export function useGuestPageSettings(eventId: string | undefined) {
  return useQuery<GuestPageSettings | null>({
    queryKey: [SETTINGS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.from('guest_page_settings').select('*').eq('event_id', eventId!).maybeSingle()
      if (error) throw error
      return (data as GuestPageSettings | null) ?? null
    },
  })
}

export function useGuestPageSettingsBySlug(slug: string | undefined) {
  return useQuery<(GuestPageSettings & { events: Pick<Event, 'id' | 'name' | 'slug' | 'date' | 'time' | 'venue' | 'logo_url' | 'cover_url' | 'accent_color' | 'invitation_enabled'> }) | null>({
    queryKey: [SETTINGS_KEY, 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, slug, date, time, venue, logo_url, cover_url, accent_color, invitation_enabled')
        .eq('slug', slug!)
        .maybeSingle()
      if (eventError) throw eventError
      if (!event) return null
      const { data: settings, error: settingsError } = await supabase
        .from('guest_page_settings')
        .select('*')
        .eq('event_id', event.id)
        .maybeSingle()
      if (settingsError) throw settingsError
      if (!settings) return null
      return { ...(settings as GuestPageSettings), events: event as Pick<Event, 'id' | 'name' | 'slug' | 'date' | 'time' | 'venue' | 'logo_url' | 'cover_url' | 'accent_color' | 'invitation_enabled'> }
    },
  })
}

export function useUpsertGuestPageSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { event_id: string } & GuestPageSettingsInput) => {
      const { data, error } = await supabase.from('guest_page_settings').upsert(input, { onConflict: 'event_id' }).select().single()
      if (error) throw error
      return data as GuestPageSettings
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, updated.event_id] })
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY, 'slug'] })
    },
  })
}
