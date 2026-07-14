import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/app-header';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/providers/confirm-dialog';
import type { Event } from '@/types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    setSlug(generateSlug(value));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await createEvent.mutateAsync({ name, slug });
      toast('Event created');
      setName('');
      setSlug('');
      setShowCreateForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      toast(message, 'error');
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Delete event?', message: 'This action cannot be undone.', confirmText: 'Delete' });
    if (!ok) return;
    try {
      await deleteEvent.mutateAsync(id);
      toast('Event deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      toast(message, 'error');
    }
  }

  function openEvent(id: string) {
    navigate(`/events/${id}`);
  }

  return (
    <>
      <AppHeader />
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Your Events</h1>
          <p className="page-subtitle">Manage your events and their seating arrangements.</p>
        </div>
        <div className="dashboard-actions" style={{ marginBottom: 'var(--space-5)' }}>
          <button className="btn btn-primary" onClick={() => setShowCreateForm((s) => !s)}>
            {showCreateForm ? 'Cancel' : 'Create New Event'}
          </button>
        </div>
        {showCreateForm && (
          <div className="card section">
            <h3 className="card-title">Create a new event</h3>
            <form className="dashboard-create-form" onSubmit={handleCreate} style={{ marginTop: 'var(--space-4)' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="event-name">Event Name</label>
                  <input id="event-name" className="input" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Spring Gala" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="event-slug">URL Slug</label>
                  <input id="event-slug" className="input" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="spring-gala" required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="submit" className="btn btn-primary">Create Event</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        {isLoading ? (
          <div className="spinner-container"><div className="spinner spinner-lg" /></div>
        ) : !events || events.length === 0 ? (
          <div className="empty-state"><p>No events yet. Create your first event to get started.</p></div>
        ) : (
          <div className="grid grid-3">
            {events.map((event: Event) => (
              <div key={event.id} className="card card-sm event-card" onClick={() => openEvent(event.id)}>
                <div className="event-card-header">
                  <h3 className="event-card-name">{event.name}</h3>
                  {event.date && <span className="badge">{event.date}</span>}
                </div>
                {event.venue && <div className="event-card-venue">{event.venue}</div>}
                <div className="event-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openEvent(event.id); }}>Manage</button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
