import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}
