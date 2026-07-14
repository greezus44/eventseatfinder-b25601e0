import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { classifyError } from '@/lib/guest-import';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const slug = newSlug || slugify(newName);
    if (!slug) {
      toast('Please enter a slug', 'error');
      return;
    }
    try {
      await createEvent.mutateAsync({
        name: newName,
        slug,
        user_id: user.id,
      });
      toast('Event created', 'success');
      setNewName('');
      setNewSlug('');
      setShowCreate(false);
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete event',
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteEvent.mutateAsync(id);
      toast('Event deleted', 'success');
    } catch (err) {
      const { message } = classifyError(err);
      toast(message, 'error');
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Events</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      {dialog}

      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="event-name">Event Name</label>
              <input
                id="event-name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewSlug(slugify(e.target.value));
                }}
                placeholder="My Wedding"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="event-slug">URL Slug</label>
              <input
                id="event-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(slugify(e.target.value))}
                placeholder="my-wedding"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createEvent.isPending}
            >
              {createEvent.isPending ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="loading-text">Loading events…</p>
        </div>
      ) : !events || events.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No events yet</p>
          <p>Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid grid-auto">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div
                className="event-card-name"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {event.name}
              </div>
              <div className="event-card-meta">
                {event.date && <span>{event.date}</span>}
                {event.venue && <span> · {event.venue}</span>}
              </div>
              <div className="event-card-meta">/e/{event.slug}</div>
              <div className="event-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(event.id, event.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
