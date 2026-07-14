import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/app-header'
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events'
import { useToast } from '@/providers/toast-provider'
import { useConfirmDialog } from '@/providers/confirm-dialog'
import type { Event } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: events, isLoading } = useEvents()
  const createEvent = useCreateEvent()
  const deleteEvent = useDeleteEvent()
  const toast = useToast()
  const { confirm, dialog } = useConfirmDialog()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setCreating(true)
    try {
      await createEvent.mutateAsync({ name: name.trim(), slug: slug.trim() })
      toast('Event created', 'success')
      setName('')
      setSlug('')
      setShowCreateForm(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create event', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (event: Event) => {
    const ok = await confirm({
      title: 'Delete event',
      message: `Delete "${event.name}"? This cannot be undone.`,
      confirmText: 'Delete',
    })
    if (!ok) return
    try {
      await deleteEvent.mutateAsync(event.id)
      toast('Event deleted', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete event', 'error')
    }
  }

  const openEvent = (event: Event) => {
    navigate(`/events/${event.id}`)
  }

  return (
    <>
      <AppHeader />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Your Events</h1>
          <p className="page-subtitle">Manage seating for your events</p>
        </div>

        <div className="section">
          <div className="dashboard-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm((v) => !v)}
            >
              {showCreateForm ? 'Cancel' : 'Create New Event'}
            </button>
          </div>

          {showCreateForm && (
            <form className="dashboard-create-form" onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="event-name">
                    Event Name
                  </label>
                  <input
                    id="event-name"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="event-slug">
                    URL Slug
                  </label>
                  <input
                    id="event-slug"
                    className="input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="dashboard-create-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating…' : 'Create Event'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="section">
          <h2 className="section-title">Events</h2>

          {isLoading ? (
            <div className="spinner-container">
              <div className="spinner spinner-lg" />
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="card card-sm event-card"
                  onClick={() => openEvent(event)}
                >
                  <div className="event-card-header">
                    <h3 className="event-card-name">{event.name}</h3>
                    {event.date && <span className="badge">{event.date}</span>}
                  </div>
                  {event.venue && (
                    <p className="event-card-venue">{event.venue}</p>
                  )}
                  <div className="event-card-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEvent(event)
                      }}
                    >
                      Manage
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEvent(event)
                      }}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(event)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No events yet. Create your first event to get started.</p>
            </div>
          )}
        </div>
      </div>
      {dialog}
    </>
  )
}
