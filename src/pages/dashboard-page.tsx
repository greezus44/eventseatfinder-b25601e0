import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import {
  useEvents,
  useCreateEvent,
  useDeleteEvent,
} from '@/hooks/use-events';
import { Event } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirmDialog();
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim() || !user) return;
    try {
      const created = await createEvent.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        user_id: user.id,
        invitation_enabled: false,
      });
      toast('Event created', 'success');
      setShowCreate(false);
      setName('');
      setSlug('');
      navigate(`/events/${created.id}`);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to create event',
        'error'
      );
    }
  };

  const handleDelete = (event: Event) => {
    confirm({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${event.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteEvent.mutateAsync(event.id);
          toast('Event deleted', 'success');
        } catch (err) {
          toast(
            err instanceof Error ? err.message : 'Failed to delete event',
            'error'
          );
        }
      },
    });
  };

  const formatDate = (event: Event) => {
    const parts: string[] = [];
    if (event.date) parts.push(event.date);
    if (event.time) parts.push(event.time);
    if (event.venue) parts.push(event.venue);
    return parts.join(' • ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Your Events</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          New Event
        </button>
      </div>

      {dialog()}

      {showCreate && (
        <div className="card mb-4">
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Wedding"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-wedding"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={createEvent.isPending}
            >
              Create
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">Loading events...</div>
      ) : !events || events.length === 0 ? (
        <div className="empty-state">
          No events yet. Click "New Event" to get started.
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div
                onClick={() => navigate(`/events/${event.id}`)}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                <div className="event-card-name">{event.name}</div>
                <div className="event-card-meta">{formatDate(event)}</div>
              </div>
              <div className="event-card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(event)}
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
