import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Table, TableInput } from '@/types'
const TABLES_KEY = ['tables'] as const
export function useTables(eventId: string | undefined) {
  return useQuery<Table[]>({ queryKey: [...TABLES_KEY, eventId], enabled: !!eventId, queryFn: async () => {
    const { data, error } = await supabase.from('tables').select('*').eq('event_id', eventId!).order('name', { ascending: true })
    if (error) throw error; return data as Table[]
  }})
}
export function useBulkCreateTables() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ event_id, tables }: { event_id: string; tables: TableInput[] }) => {
    const { data, error } = await supabase.from('tables').insert(tables).select()
    if (error) throw error; return data as Table[]
  }, onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: [...TABLES_KEY, vars.event_id] }) })
}
export function useDeleteTable() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from('tables').delete().eq('id', id)
    if (error) throw error
  }, onSuccess: () => qc.invalidateQueries({ queryKey: TABLES_KEY }) })
}
