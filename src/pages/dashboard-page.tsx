import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { Spinner, ErrorScreen, LoadingScreen } from '@/components/ui/feedback';

export function DashboardPage() {
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  if (isLoading) return <LoadingScreen message="Loading your events..." />;
  if (error) return <ErrorScreen message="Failed to load events" />;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Event name is required', 'error');
      return;
    }

    try {
      await createEvent.mutateAsync({
        name: name.trim(),
        date: date || null,
        time: time || null,
        venue: venue.trim() || null,
      });
      toast('Event created successfully', 'success');
      setShowModal(false);
      setName('');
      setDate('');
      setTime('');
      setVenue('');
    } catch {
      toast('Failed to create event', 'error');
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Your Events</h1>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          Create New Event
        </button>
      </div>

      <div className="page__body">
        {!events || events.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: 'var(--space-8)' }}
          >
            <h2 style={{ marginBottom: 'var(--space-2)' }}>No events yet</h2>
            <p
              className="text-secondary"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Create your first event to get started with seating arrangements.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => setShowModal(true)}
            >
              Create New Event
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <h3 className="event-card__title">{event.name}</h3>
                <div className="event-card__meta">
                  <span className="text-secondary">
                    {formatDate(event.date)}
                  </span>
                  {event.time && (
                    <span className="text-muted"> · {event.time}</span>
                  )}
                </div>
                {event.venue && (
                  <div className="event-card__meta text-secondary">
                    {event.venue}
                  </div>
                )}

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
                    to={`/e/${event.slug}`}
                    className="btn btn--ghost btn--sm"
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-5)' }}>Create New Event</h2>
            <form onSubmit={handleCreate}>
              <div className="form-field">
                <label className="form-field__label" htmlFor="event-name">
                  Event Name
                </label>
                <input
                  id="event-name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Spring Gala 2025"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-field__label" htmlFor="event-date">
                    Date
                  </label>
                  <input
                    id="event-date"
                    type="date"
                    className="input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-field__label" htmlFor="event-time">
                    Time
                  </label>
                  <input
                    id="event-time"
                    type="time"
                    className="input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-field__label" htmlFor="event-venue">
                  Venue
                </label>
                <input
                  id="event-venue"
                  type="text"
                  className="input"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Grand Ballroom, Hilton Hotel"
                />
              </div>

              <div
                className="flex gap-3"
                style={{
                  justifyContent: 'flex-end',
                  marginTop: 'var(--space-5)',
                }}
              >
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={createEvent.isPending}
                >
                  {createEvent.isPending ? (
                    <Spinner size={20} />
                  ) : (
                    'Create Event'
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
