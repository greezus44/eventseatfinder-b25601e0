import { useNavigate } from 'react-router-dom'
import { useEvents } from '@/hooks/use-events'
import { useToast } from '@/providers/toast-provider'
import { supabase } from '@/lib/supabase'
import { useConfirm } from '@/providers/confirm-dialog'

export default function DashboardPage() {
  const { events, loading, refetch } = useEvents()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const handleCreate = async () => {
    const { data, error } = await supabase.from('events').insert({
      name: 'Untitled Event',
      title_text: 'Wedding of Aisyah & Hafiz',
      subtitle_text: 'Khamis, 15 Februari 2025',
      logo_size: 80,
      title_size: 28,
      title_color: '#1a1a1a',
      subtitle_size: 16,
      subtitle_color: '#555555',
      datetime_size: 14,
      datetime_color: '#777777',
      venue_text_size: 14,
      venue_text_color: '#777777',
      background_color: '#fafafa',
      accent_color: '#1a1a1a',
      text_color: '#1a1a1a',
    }).select().single()

    if (error) {
      toast('Failed to create event', 'error')
      return
    }
    navigate(`/events/${data.id}`)
  }

  const handleDelete = (id: string, name: string) => {
    confirm({
      message: `Delete "${name}"? This will remove all guests and tables for this event.`,
      onConfirm: async () => {
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) {
          toast('Failed to delete event', 'error')
        } else {
          toast('Event deleted')
          refetch()
        }
      },
    })
  }

  if (loading) {
    return <div className="spinner-container"><div className="spinner spinner-lg" /></div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Your Events</h1>
        <p className="page-subtitle">Manage seating for your events</p>
      </div>
      <div className="events-grid">
        {events.map(ev => (
          <div key={ev.id} className="card event-card" onClick={() => navigate(`/events/${ev.id}`)}>
            <div className="event-card-name">{ev.name}</div>
            <div className="event-card-meta">
              {ev.date && <span>{new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
              {ev.venue && <span>{ev.venue}</span>}
            </div>
            <div className="event-card-footer">
              <span className="event-card-guests">Click to manage</span>
              <div className="event-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/events/${ev.id}`) }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(ev.id, ev.name) }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        <button className="new-event-btn" onClick={handleCreate}>
          <span className="new-event-icon">+</span>
          <span>Create New Event</span>
        </button>
      </div>
    </div>
  )
}
