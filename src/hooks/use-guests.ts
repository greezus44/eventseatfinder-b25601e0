import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Guest, GuestInput } from '@/types'
const GUESTS_KEY = ['guests'] as const
export function useGuests(eventId: string | undefined) {
  return useQuery<Guest[]>({ queryKey: [...GUESTS_KEY, eventId], enabled: !!eventId, queryFn: async () => {
    const { data, error } = await supabase.from('guests').select('*').eq('event_id', eventId!).order('name', { ascending: true })
    if (error) throw error; return data as Guest[]
  }})
}
export function useCreateGuest() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (input: GuestInput) => {
    const { data, error } = await supabase.from('guests').insert(input).select().single()
    if (error) throw error; return data as Guest
  }, onSuccess: (g) => qc.invalidateQueries({ queryKey: [...GUESTS_KEY, g.event_id] }) })
}
export function useUpdateGuest() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ id, ...input }: { id: string } & GuestInput) => {
    const { data, error } = await supabase.from('guests').update(input).eq('id', id).select().single()
    if (error) throw error; return data as Guest
  }, onSuccess: (g) => qc.invalidateQueries({ queryKey: [...GUESTS_KEY, g.event_id] }) })
}
export function useDeleteGuest() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from('guests').delete().eq('id', id)
    if (error) throw error
  }, onSuccess: () => qc.invalidateQueries({ queryKey: GUESTS_KEY }) })
}
export function useBulkCreateGuests() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ event_id, guests }: { event_id: string; guests: GuestInput[] }) => {
    const { data, error } = await supabase.from('guests').insert(guests).select()
    if (error) throw error; return data as Guest[]
  }, onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: [...GUESTS_KEY, vars.event_id] }) })
}
