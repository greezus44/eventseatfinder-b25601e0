import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '@/hooks/use-events';
import { useCreateEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { Event } from '@/types/event';

function EventCard({ event }: { event: Event }) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="event-card card">
      <div
        style={{
          height: '4px',
          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          background: event.accent_color ?? 'var(--primary)',
          margin:
            'calc(var(--space-4) * -1) calc(var(--space-4) * -1) var(--space-4)',
        }}
      />
      <h3 style={{ marginBottom: 'var(--space-1)' }}>{event.name}</h3>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-1)' }}>
        {formatDate(event.date)}
        {event.time ? ` at ${event.time}` : ''}
      </p>
      <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
        {event.venue || 'Venue TBD'}
      </p>

      <div
        className="flex gap-2"
        style={{ flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}
      >
        <Link to={`/events/${event.id}`} className="btn btn--secondary btn--sm">
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
          to={`/events/${event.id}/print`}
          className="btn btn--secondary btn--sm"
        >
          Print
        </Link>
      </div>

      <div
        className="flex gap-2"
        style={{
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border)',
          paddingTop: 'var(--space-3)',
        }}
      >
        <Link to={`/e/${event.slug}`} className="btn btn--primary btn--sm">
          Find Your Seat →
        </Link>
        {event.invitation_enabled && (
          <Link to={`/invite/${event.slug}`} className="btn btn--ghost btn--sm">
            Invitation →
          </Link>
        )}
      </div>
    </div>
  );
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
  const createEvent = useCreateEvent();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createEvent.mutateAsync({
        name: name.trim(),
        date: date || null,
        time: time || null,
        venue: venue.trim() || null,
      });
      toast('Event created successfully', 'success');
      onClose();
    } catch {
      toast('Failed to create event', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 'var(--space-5)' }}>Create New Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-field__label" htmlFor="event-name">
              Event Name
            </label>
            <input
              id="event-name"
              className="input w-full"
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
                className="input w-full"
                type="date"
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
                className="input w-full"
                type="time"
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
              className="input w-full"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Grand Ballroom Hotel"
            />
          </div>

          <div
            className="flex gap-3"
            style={{ justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}
          >
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={createEvent.isPending}
              style={{ gap: 'var(--space-2)' }}
            >
              {createEvent.isPending && <Spinner size={16} />}
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: events, isLoading, error } = useEvents();
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <LoadingScreen message="Loading your events..." />;
  if (error) return <ErrorScreen message={error.message} />;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Your Events</h1>
        <button
          className="btn btn--primary"
          onClick={() => setShowCreate(true)}
        >
          Create New Event
        </button>
      </div>

      <div className="page__body">
        {events && events.length > 0 ? (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
            }}
          >
            <h2
              className="text-secondary"
              style={{ marginBottom: 'var(--space-2)' }}
            >
              No events yet
            </h2>
            <p
              className="text-muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Create your first event to get started with seating arrangements.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => setShowCreate(true)}
            >
              Create New Event
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
