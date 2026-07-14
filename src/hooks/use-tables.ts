import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Table } from '@/types'

export function useTables(eventId: string | undefined) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTables = useCallback(async () => {
    if (!eventId) {
      setTables([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('tables').select('*').eq('event_id', eventId).order('name', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setTables(data || [])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  return { tables, loading, error, refetch: fetchTables }
}
