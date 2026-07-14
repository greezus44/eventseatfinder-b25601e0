import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event, EventInput } from '@/types'

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
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

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data as Event | null
    },
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: EventInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('events')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Event
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }) },
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: EventInput & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Event
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['events', vars.id] })
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }) },
  })
}

export function useCheckSlugAvailability({ slug, eventId }: { slug: string; eventId: string }) {
  return useQuery({
    queryKey: ['slug-check', slug, eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .neq('id', eventId)
        .maybeSingle()
      if (error) throw error
      return { available: data === null }
    },
    enabled: false,
  })
}
