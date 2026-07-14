import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Table, TableInput } from '@/types'

export function useTables(eventId: string) {
  return useQuery({ queryKey: ['tables', eventId], queryFn: async () => { const { data, error } = await supabase.from('tables').select('*').eq('event_id', eventId).order('number', { ascending: true }); if (error) throw error; return data as Table[] }, enabled: !!eventId })
}
export function useBulkCreateTables() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ event_id, tables }: { event_id: string; tables: Omit<TableInput, 'event_id'>[] }) => { const rows = tables.map((t) => ({ ...t, event_id })); const { data, error } = await supabase.from('tables').insert(rows).select(); if (error) throw error; return { event_id, data } }, onSuccess: (result) => { qc.invalidateQueries({ queryKey: ['tables', result.event_id] }) } })
}
export function useDeleteTable() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => { const { data: table } = await supabase.from('tables').select('event_id').eq('id', id).maybeSingle(); await supabase.from('guests').update({ table_id: null }).eq('table_id', id); const { error } = await supabase.from('tables').delete().eq('id', id); if (error) throw error; return table?.event_id as string | undefined }, onSuccess: (eventId) => { if (eventId) { qc.invalidateQueries({ queryKey: ['tables', eventId] }); qc.invalidateQueries({ queryKey: ['guests', eventId] }) } } })
}
