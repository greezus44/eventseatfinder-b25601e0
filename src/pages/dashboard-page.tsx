import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { generateSlug } from '@/lib/slug';
import { LoadingScreen } from '@/components/ui/feedback';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newEventName.trim();
    if (!name) return;
    try {
      await createEvent.mutateAsync({
        name,
        slug: generateSlug(name),
      });
      toast('Event created', 'success');
      setNewEventName('');
      setShowNewEvent(false);
    } catch {
      toast('Could not create event', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget);
      toast('Event deleted', 'success');
    } catch {
      toast('Could not delete event', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (isLoading) return <LoadingScreen label="Loading events…" />;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Events</h1>
        <button
          className="btn btn--primary"
          onClick={() => setShowNewEvent((prev) => !prev)}
        >
          {showNewEvent ? 'Cancel' : 'New Event'}
        </button>
      </div>

      {showNewEvent && (
        <form
          className="card"
          onSubmit={handleCreate}
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <div className="form-field">
            <label className="form-field__label" htmlFor="new-event-name">
              Event name
            </label>
            <input
              id="new-event-name"
              className="input"
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g. Annual Gala 2024"
              autoFocus
            />
          </div>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={createEvent.isPending}
          >
            {createEvent.isPending ? 'Creating…' : 'Create event'}
          </button>
        </form>
      )}

      {events && events.length === 0 && (
        <div className="card">
          <p className="text-secondary">
            No events yet. Create one to get started.
          </p>
        </div>
      )}

      <div className="event-grid">
        {events?.map((event) => (
          <div key={event.id} className="event-card">
            <h2 className="event-card__title">{event.name}</h2>
            <div className="event-card__meta">
              <span>{formatDate(event.date)}</span>
              {event.venue && <span>{event.venue}</span>}
              {event.invitation_enabled && (
                <span className="badge">Invitations on</span>
              )}
            </div>
            <div className="event-card__footer">
              <Link
                to={`/events/${event.id}`}
                className="btn btn--secondary btn--sm"
              >
                Edit
              </Link>
              <Link
                to={`/events/${event.id}/guests`}
                className="btn btn--secondary btn--sm"
              >
                Guests
              </Link>
              <Link
                to={`/events/${event.id}/seating`}
                className="btn btn--secondary btn--sm"
              >
                Seating
              </Link>
              <Link
                to={`/events/${event.id}/overview`}
                className="btn btn--secondary btn--sm"
              >
                Overview
              </Link>
              <Link
                to={`/events/${event.id}/check-in`}
                className="btn btn--secondary btn--sm"
              >
                Check-in
              </Link>
              <Link
                to={`/events/${event.id}/analytics`}
                className="btn btn--secondary btn--sm"
              >
                Analytics
              </Link>
              <Link
                to={`/events/${event.id}/print`}
                className="btn btn--secondary btn--sm"
              >
                Print
              </Link>
              <Link
                to={`/e/${event.slug}`}
                className="btn btn--secondary btn--sm"
              >
                Find Your Seat
              </Link>
              <Link
                to={`/events/${event.id}/guest-page`}
                className="btn btn--secondary btn--sm"
              >
                Guest Page
              </Link>
              {event.invitation_enabled && (
                <Link
                  to={`/invite/${event.slug}`}
                  className="btn btn--secondary btn--sm"
                >
                  Invitation
                </Link>
              )}
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setDeleteTarget(event.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete event"
          message="This will permanently delete the event and all associated data. This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
