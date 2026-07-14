import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GuestPageSettings, GuestPageSettingsInput } from '@/types'

export function useGuestPageSettings(eventId: string) {
  return useQuery({
    queryKey: ['guest-page-settings', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from('guest_page_settings').select('*').eq('event_id', eventId).maybeSingle()
      if (error) throw error
      return data as GuestPageSettings | null
    },
    enabled: !!eventId,
  })
}

export function useGuestPageSettingsBySlug(slug: string) {
  return useQuery({
    queryKey: ['guest-page-settings-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('guest_page_settings').select('*, events!inner(*)').eq('events.slug', slug).maybeSingle()
      if (error) throw error
      return data as (GuestPageSettings & { events: { name: string; date: string | null; time: string | null; venue: string | null; logo_url: string | null } }) | null
    },
    enabled: !!slug,
  })
}

export function useUpsertGuestPageSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GuestPageSettingsInput & { event_id: string }) => {
      const { data: existing } = await supabase.from('guest_page_settings').select('id').eq('event_id', input.event_id).maybeSingle()
      if (existing) {
        const { event_id, ...update } = input
        const { data, error } = await supabase.from('guest_page_settings').update(update).eq('event_id', input.event_id).select('*').single()
        if (error) throw error
        return data as GuestPageSettings
      } else {
        const { data, error } = await supabase.from('guest_page_settings').insert(input).select('*').single()
        if (error) throw error
        return data as GuestPageSettings
      }
    },
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ['guest-page-settings', variables.event_id] })
      qc.invalidateQueries({ queryKey: ['guest-page-settings-slug'] })
    },
  })
}
