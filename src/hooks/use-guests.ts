import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Guest, GuestInput } from '@/types'

export function useGuests(eventId: string) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true })
      if (error) throw error
      return data as Guest[]
    },
    enabled: !!eventId,
  })
}

export function useUpdateGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: GuestInput & { id: string }) => {
      const { data, error } = await supabase
        .from('guests')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Guest
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['guests', vars.event_id] }) },
  })
}

export function useDeleteGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: guest } = await supabase.from('guests').select('event_id').eq('id', id).maybeSingle()
      const { error } = await supabase.from('guests').delete().eq('id', id)
      if (error) throw error
      return guest?.event_id as string | undefined
    },
    onSuccess: (eventId) => { if (eventId) qc.invalidateQueries({ queryKey: ['guests', eventId] }) },
  })
}

export function useBulkCreateGuests() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ event_id, guests }: { event_id: string; guests: GuestInput[] }) => {
      const { data, error } = await supabase.from('guests').insert(guests).select()
      if (error) throw error
      return { event_id, data }
    },
    onSuccess: (result) => { qc.invalidateQueries({ queryKey: ['guests', result.event_id] }) },
  })
}
