import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { Event } from '@/types/event';

export function DashboardPage() {
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = search.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.venue ?? '').toLowerCase().includes(q),
    );
  }, [events, search]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast('Event deleted', 'success');
      setConfirmDelete(null);
    } catch {
      toast('Failed to delete event', 'error');
    }
  };

  if (isLoading) return <LoadingScreen message="Loading events…" />;
  if (error)
    return <ErrorScreen message="Failed to load events. Please try again." />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary">
            Manage your events and seating arrangements.
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowCreate(true)}
        >
          + New Event
        </button>
      </div>

      <div className="page__search">
        <input
          type="text"
          className="input"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="page__body">
        {filtered.length === 0 ? (
          <div className="card card--hover">
            <h3 style={{ marginBottom: 'var(--space-2)' }}>
              {search ? 'No events found' : 'No events yet'}
            </h3>
            <p className="text-secondary">
              {search
                ? 'Try a different search term.'
                : 'Create your first event to get started with seating management.'}
            </p>
          </div>
        ) : (
          <div className="event-grid">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={() => setConfirmDelete(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          creating={createEvent.isPending}
          onCreate={async (name) => {
            try {
              const created = await createEvent.mutateAsync({ name });
              toast('Event created', 'success');
              setShowCreate(false);
              return created;
            } catch {
              toast('Failed to create event', 'error');
              return null;
            }
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete event?"
          message="This will permanently delete the event and all its data. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          pending={deleteEvent.isPending}
        />
      )}
    </div>
  );
}

function EventCard({
  event,
  onDelete,
}: {
  event: Event;
  onDelete: () => void;
}) {
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="card card--hover event-card">
      <Link to={`/events/${event.id}`} className="event-card__link">
        <div className="event-card__body">
          <h3 className="event-card__name">{event.name}</h3>
          {formattedDate && <p className="event-card__date">{formattedDate}</p>}
          {event.venue && <p className="event-card__venue">{event.venue}</p>}
        </div>
      </Link>
      <div className="event-card__footer">
        <div className="flex gap-2">
          <Link
            to={`/events/${event.id}/guests`}
            className="btn btn--ghost"
            style={{ fontSize: '0.8125rem' }}
          >
            Guests
          </Link>
          <Link
            to={`/e/${event.slug}`}
            className="btn btn--ghost"
            style={{ fontSize: '0.8125rem' }}
          >
            Find Your Seat →
          </Link>
        </div>
        <button
          className="btn btn--ghost event-card__delete"
          onClick={onDelete}
          aria-label="Delete event"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onCreate,
  creating,
}: {
  onClose: () => void;
  onCreate: (name: string) => Promise<Event | null>;
  creating: boolean;
}) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    const created = await onCreate(name.trim());
    if (created) setName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Create Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="event-name" className="auth-form__label">
              Event Name
            </label>
            <input
              id="event-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah & James Wedding"
              required
              autoFocus
              disabled={creating}
            />
          </div>
          <div
            className="flex gap-3"
            style={{ marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}
          >
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={creating || !name.trim()}
            >
              {creating ? <Spinner size={18} /> : null}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  pending,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>{title}</h2>
        <p
          className="text-secondary"
          style={{ marginBottom: 'var(--space-5)' }}
        >
          {message}
        </p>
        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            disabled={pending}
            style={{ background: '#dc2626' }}
          >
            {pending ? <Spinner size={18} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
