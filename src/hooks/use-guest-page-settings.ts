import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { GuestPageSettings } from '@/types'

export function useGuestPageSettings(eventId: string | undefined) {
  const [settings, setSettings] = useState<GuestPageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!eventId) {
      setSettings(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('guest_page_settings')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle()
    if (error) {
      setError(error.message)
    } else {
      setSettings(data)
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { settings, loading, error, refetch: fetchSettings }
}
