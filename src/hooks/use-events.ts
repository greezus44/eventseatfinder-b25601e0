import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event, EventInput } from '@/types'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Event[]
    },
  })
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (error) throw error
      return data as Event
    },
    enabled: !!eventId,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data, error } = await supabase.from('events').insert(input).select().single()
      if (error) throw error
      return data as Event
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & EventInput) => {
      const { data, error } = await supabase.from('events').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Event
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['event', data.id] })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useCheckSlugAvailability() {
  return useMutation({
    mutationFn: async ({ slug, eventId }: { slug: string; eventId?: string }) => {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      if (!data) return true
      if (eventId && data.id === eventId) return true
      return false
    },
  })
}
