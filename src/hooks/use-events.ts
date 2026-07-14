import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event, EventInput } from '@/types'

const EVENTS_KEY = ['events'] as const

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: EVENTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Event[]
    },
  })
}

export function useEvent(eventId: string | undefined) {
  return useQuery<Event>({
    queryKey: [...EVENTS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId!)
        .single()
      if (error) throw error
      return data as Event
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data, error } = await supabase
        .from('events')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Event
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & EventInput) => {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Event
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...EVENTS_KEY, updated.id] })
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
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY })
    },
  })
}

export function useCheckSlugAvailability({ slug, eventId }: { slug: string; eventId?: string }) {
  return useQuery<{ available: boolean }>({
    queryKey: ['event-slug', slug, eventId],
    enabled: !!slug,
    queryFn: async () => {
      let query = supabase.from('events').select('id').eq('slug', slug)
      if (eventId) query = query.neq('id', eventId)
      const { data, error } = await query
      if (error) throw error
      return { available: !data || data.length === 0 }
    },
  })
}
