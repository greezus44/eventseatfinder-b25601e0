import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Table, TableInput } from '@/types'

const TABLES_KEY = 'tables'

export function useTables(eventId: string | undefined) {
  return useQuery<Table[]>({
    queryKey: [TABLES_KEY, eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', eventId!)
        .order('number', { ascending: true })
      if (error) throw error
      return data as Table[]
    },
  })
}

export function useCreateTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Table
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, created.event_id] })
    },
  })
}

export function useUpdateTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TableInput) => {
      const { data, error } = await supabase
        .from('tables')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Table
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, updated.event_id] })
    },
  })
}

export function useDeleteTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tables').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY] })
    },
  })
}

export function useBulkCreateTables() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      event_id,
      tables,
    }: {
      event_id: string
      tables: Array<Omit<TableInput, 'event_id'>>
    }) => {
      const rows = tables.map((t) => ({ ...t, event_id }))
      const { data, error } = await supabase.from('tables').insert(rows).select()
      if (error) throw error
      return data as Table[]
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.event_id] })
    },
  })
}
