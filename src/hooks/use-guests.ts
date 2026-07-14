import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Guest[]
    },
    enabled: !!eventId,
  })
}

export function useCreateGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GuestInput) => {
      const { data, error } = await supabase.from('guests').insert(input).select().single()
      if (error) throw error
      return data as Guest
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests'] })
    },
  })
}

export function useUpdateGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, eventId, ...input }: { id: string; eventId?: string } & GuestInput) => {
      const { data, error } = await supabase.from('guests').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Guest
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests'] })
    },
  })
}

export function useDeleteGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('guests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests'] })
    },
  })
}

export function useBulkCreateGuests() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ event_id, guests }: { event_id: string; guests: GuestInput[] }) => {
      console.log(`[BulkCreate] Starting insert of ${guests.length} guests for event ${event_id}`)
      const batchSize = 500
      let inserted = 0
      for (let i = 0; i < guests.length; i += batchSize) {
        const batch = guests.slice(i, i + batchSize)
        const { data, error } = await supabase.from('guests').insert(batch)
        if (error) {
          console.error(`[BulkCreate] Error at batch ${Math.floor(i / batchSize) + 1}:`, error)
          throw error
        }
        inserted += batch.length
        console.log(`[BulkCreate] Inserted ${inserted}/${guests.length}`)
      }
      console.log(`[BulkCreate] Complete: ${inserted} guests inserted`)
      return inserted
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guests'] })
    },
  })
}
