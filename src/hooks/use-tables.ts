import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Table, TableInput } from '@/types'

export function useTables(eventId: string) {
  return useQuery({
    queryKey: ['tables', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId)
        .order('number', { ascending: true })
      if (error) throw error
      return data as Table[]
    },
    enabled: !!eventId,
  })
}

export function useCreateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TableInput) => {
      const { data, error } = await supabase.from('tables').insert(input).select().single()
      if (error) throw error
      return data as Table
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useUpdateTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<TableInput>) => {
      const { data, error } = await supabase.from('tables').update(input).eq('id', id).select().single()
      if (error) throw error
      return data as Table
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useDeleteTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tables').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useBulkCreateTables() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ event_id, tables }: { event_id: string; tables: TableInput[] }) => {
      const { data, error } = await supabase.from('tables').insert(tables)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
