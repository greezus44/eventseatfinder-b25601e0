import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event, EventInput } from '@/types'

const queryKey = ['events']

export function useEvents() {
  return useQuery<Event[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useEvent(eventId: string | undefined) {
  return useQuery<Event | null>({
    queryKey: ['events', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) return null
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (error) throw error
      return data
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data, error } = await supabase.from('events').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & EventInput) => {
      const { data, error } = await supabase.from('events').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Event
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['events', data.id] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useCheckSlugAvailability() {
  return useMutation({
    mutationFn: async ({ slug, eventId }: { slug: string; eventId?: string }) => {
      const { data, error } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle()
      if (error) throw error
      if (!data) return true
      if (eventId && data.id === eventId) return true
      return false
    },
  })
}
