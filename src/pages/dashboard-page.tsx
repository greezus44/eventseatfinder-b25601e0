import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { ErrorScreen, LoadingScreen, Spinner } from '@/components/ui/feedback';

export function DashboardPage() {
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
  });

  const openModal = () => {
    setForm({ name: '', date: '', time: '', venue: '' });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    try {
      await createEvent.mutateAsync({
        name: form.name.trim(),
        date: form.date || null,
        time: form.time || null,
        venue: form.venue.trim() || null,
      });
      toast('Event created', 'success');
      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create event';
      toast(message, 'error');
    }
  };

  if (isLoading) return <LoadingScreen message="Loading your events…" />;
  if (error)
    return <ErrorScreen message={error.message || 'Failed to load events'} />;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1>Your Events</h1>
          <p className="text-secondary">
            Manage seating for your upcoming events
          </p>
        </div>
        <button className="btn btn--primary" onClick={openModal}>
          + Create New Event
        </button>
      </header>

      {events && events.length === 0 ? (
        <div className="card empty-state">
          <h2>No events yet</h2>
          <p className="text-secondary">
            Create your first event to start arranging seating.
          </p>
          <button className="btn btn--primary" onClick={openModal}>
            Create New Event
          </button>
        </div>
      ) : (
        <div className="event-grid">
          {events?.map((event) => (
            <div key={event.id} className="card event-card">
              <div className="event-card__head">
                <span
                  className="event-card__accent"
                  style={{
                    background: event.accent_color ?? 'var(--color-primary)',
                  }}
                />
                <h3 className="event-card__title">{event.name}</h3>
              </div>
              <div className="event-card__meta">
                {event.date && (
                  <span className="event-card__meta-item">
                    📅 {formatDate(event.date)}
                  </span>
                )}
                {event.time && (
                  <span className="event-card__meta-item">🕐 {event.time}</span>
                )}
                {event.venue && (
                  <span className="event-card__meta-item">
                    📍 {event.venue}
                  </span>
                )}
              </div>
              <div className="event-card__actions">
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
                  to={`/e/${event.slug}`}
                  className="btn btn--ghost btn--sm event-card__public"
                >
                  Find Your Seat →
                </Link>
                {event.invitation_enabled && (
                  <Link
                    to={`/invite/${event.slug}`}
                    className="btn btn--ghost btn--sm"
                  >
                    Invitation →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal__title">Create New Event</h2>
            <form className="modal__form" onSubmit={handleCreate}>
              <label className="form-field">
                <span className="form-field__label">Event name</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Spring Gala 2025"
                  autoFocus
                  required
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span className="form-field__label">Date</span>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </label>
                <label className="form-field">
                  <span className="form-field__label">Time</span>
                  <input
                    className="input"
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, time: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="form-field">
                <span className="form-field__label">Venue</span>
                <input
                  className="input"
                  value={form.venue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, venue: e.target.value }))
                  }
                  placeholder="Grand Ballroom, Hotel Plaza"
                />
              </label>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? (
                    <Spinner size={18} />
                  ) : (
                    'Create event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
