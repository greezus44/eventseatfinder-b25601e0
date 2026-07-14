import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events'
import { useToast } from '@/providers/toast-provider'
import { useConfirmDialog } from '@/providers/confirm-dialog'
import { AppHeader } from '@/components/app-header'
import type { EventInput } from '@/types'

export function DashboardPage() {
  const { data: events, isLoading } = useEvents()
  const createEvent = useCreateEvent()
  const deleteEvent = useDeleteEvent()
  const toast = useToast()
  const { confirm, dialog } = useConfirmDialog()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const finalSlug = slug.trim() || generateSlug(name)
    try {
      const event = await createEvent.mutateAsync({ name: name.trim(), slug: finalSlug })
      toast('Event created successfully')
      setShowCreate(false); setName(''); setSlug('')
      navigate(`/events/${event.id}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create event', 'error')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({ title: 'Delete Event', message: `Are you sure you want to delete "${name}"? This cannot be undone.`, confirmText: 'Delete' })
    if (!confirmed) return
    try { await deleteEvent.mutateAsync(id); toast('Event deleted') }
    catch (err) { toast(err instanceof Error ? err.message : 'Failed to delete event', 'error') }
  }

  return (
    <>
      <AppHeader />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Your Events</h1>
          <p className="page-subtitle">Create and manage your seating arrangements</p>
        </div>
        <div className="section">
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create New Event'}</button>
          </div>
          {showCreate && (
            <div className="card section" style={{ marginTop: 'var(--space-5)' }}>
              <h3 className="section-title">New Event</h3>
              <form onSubmit={handleCreate} className="dashboard-create-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event Name</label>
                    <input className="input" value={name} onChange={(e) => { setName(e.target.value); if (!slug || slug === generateSlug(name)) setSlug(generateSlug(e.target.value)) }} placeholder="My Wedding" required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL Slug</label>
                    <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-wedding" required />
                  </div>
                </div>
                <div className="dashboard-create-actions">
                  <button type="submit" className="btn btn-primary" disabled={createEvent.isPending}>{createEvent.isPending ? 'Creating…' : 'Create Event'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="spinner-container"><div className="spinner spinner-lg" /></div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-3">
            {events.map((event) => (
              <div key={event.id} className="card card-sm event-card" onClick={() => navigate(`/events/${event.id}`)}>
                <div className="event-card-header">
                  <h3 className="event-card-name">{event.name}</h3>
                  {event.date && <span className="badge">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
                {event.venue && <p className="event-card-venue">{event.venue}</p>}
                <div className="event-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`) }}>Manage</button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); window.open(`/e/${event.slug}`, '_blank') }}>View</button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(event.id, event.name) }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No events yet</h3>
            <p>Click "Create New Event" to get started with your first seating arrangement.</p>
          </div>
        )}
      </div>
      {dialog}
    </>
  )
}
