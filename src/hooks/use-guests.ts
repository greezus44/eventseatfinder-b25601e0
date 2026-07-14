import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Guest, GuestInput } from '@/types'

const GUESTS_KEY = 'guests'

export function useGuests(eventId: string | undefined) {
  return useQuery<Guest[]>({
    queryKey: [GUESTS_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Guest[]
    },
  })
}

export function useCreateGuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Guest
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, created.event_id] })
    },
  })
}

export function useUpdateGuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & GuestInput) => {
      const { data, error } = await supabase
        .from('guests')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Guest
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, updated.event_id] })
    },
  })
}

export function useDeleteGuest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY] })
    },
  })
}

export function useBulkCreateGuests() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ event_id, guests }: { event_id: string; guests: GuestInput[] }) => {
      const BATCH_SIZE = 500
      const rows = guests.map((g) => ({
        event_id,
        name: g.name,
        table_id: g.table_id ?? null,
      }))
      const inserted: Guest[] = []
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase.from('guests').insert(batch).select()
        if (error) throw error
        if (data) inserted.push(...(data as Guest[]))
      }
      return inserted
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, variables.event_id] })
    },
  })
}
