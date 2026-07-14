import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events'
import { useGuests } from '@/hooks/use-guests'
import { useToast } from '@/providers/toast-provider'
import { useConfirmDialog } from '@/providers/confirm-dialog'
import { AppHeader } from '@/components/app-header'

function GuestCount({ eventId }: { eventId: string }) {
  const { data } = useGuests(eventId); return <>{data?.length ?? 0}</>
}
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event'
}
export function DashboardPage() {
  const { data: events, isLoading } = useEvents()
  const createEvent = useCreateEvent(); const deleteEvent = useDeleteEvent()
  const toast = useToast(); const { confirm } = useConfirmDialog(); const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false); const [name, setName] = useState(''); const [creating, setCreating] = useState(false)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setCreating(true)
    try { const ev = await createEvent.mutateAsync({ name: name.trim(), slug: slugify(name) }); toast('Event created'); setShowModal(false); setName(''); navigate(`/events/${ev.id}`) }
    catch (err) { toast(err instanceof Error ? err.message : 'Failed to create event', 'error') }
    finally { setCreating(false) }
  }
  const handleDelete = async (id: string, evName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await confirm({ title: 'Delete Event', message: `Delete "${evName}" and all its guests and tables?`, confirmText: 'Delete', danger: true })
    if (!confirmed) return
    try { await deleteEvent.mutateAsync(id); toast('Event deleted') }
    catch (err) { toast(err instanceof Error ? err.message : 'Failed to delete', 'error') }
  }
  return (
    <>
      <AppHeader />
      <div className="page">
        <div className="page-header"><h1 className="page-title">My Events</h1><p className="page-subtitle">Manage your event seating plans</p></div>
        {isLoading ? <div className="spinner-container"><div className="spinner" /></div> : (
          <div className="events-grid">
            {events?.map((ev) => (
              <div key={ev.id} className="card event-card" onClick={() => navigate(`/events/${ev.id}`)}>
                <div className="event-card-name">{ev.name}</div>
                <div className="event-card-meta">
                  {ev.date && <span>{new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                  {ev.venue && <span>{ev.venue}</span>}
                </div>
                <div className="event-card-footer">
                  <span className="event-card-guests"><GuestCount eventId={ev.id} /> guests</span>
                  <div className="event-card-actions"><button className="btn btn-ghost btn-sm" onClick={(e) => handleDelete(ev.id, ev.name, e)}>Delete</button></div>
                </div>
              </div>
            ))}
            <button className="new-event-btn" onClick={() => setShowModal(true)}><span className="new-event-icon">+</span><span>New Event</span></button>
          </div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New Event</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label className="form-label">Event Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Wedding" autoFocus required /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating || !name.trim()}>{creating ? 'Creating…' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
