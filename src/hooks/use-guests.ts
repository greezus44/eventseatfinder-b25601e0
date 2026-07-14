import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Guest } from '@/types'

export function useGuests(eventId: string | undefined) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuests = useCallback(async () => {
    if (!eventId) {
      setGuests([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('guests').select('*').eq('event_id', eventId).order('name', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setGuests(data || [])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  return { guests, loading, error, refetch: fetchGuests }
}
