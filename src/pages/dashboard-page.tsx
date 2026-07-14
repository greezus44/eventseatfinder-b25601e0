import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { Spinner, LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { Event } from '@/types/event';

export function DashboardPage() {
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  const resetForm = () => {
    setName('');
    setDate('');
    setTime('');
    setVenue('');
  };

  const handleCreate = async (e: React.FormEvent) => {
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
      resetForm();
      setShowModal(false);
    } catch {
      toast('Failed to create event', 'error');
    }
  };

  if (isLoading) return <LoadingScreen message="Loading your events..." />;
  if (error) return <ErrorScreen message="Failed to load events." />;

  return (
    <div className="page">
      <div className="page__header">
        <div
          className="flex"
          style={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h1>Your Events</h1>
          <button
            className="btn btn--primary"
            onClick={() => setShowModal(true)}
          >
            + Create New Event
          </button>
        </div>
      </div>
      <div className="page__body">
        {events && events.length === 0 ? (
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
              + Create New Event
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {events?.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Create New Event</h2>
            <form onSubmit={handleCreate}>
              <div
                className="form-field"
                style={{ marginBottom: 'var(--space-3)' }}
              >
                <label className="form-field__label">Event Name</label>
                <input
                  className="input w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wedding Reception"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div
                  className="form-field"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <label className="form-field__label">Date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div
                  className="form-field"
                  style={{ marginBottom: 'var(--space-3)' }}
                >
                  <label className="form-field__label">Time</label>
                  <input
                    type="time"
                    className="input w-full"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <div
                className="form-field"
                style={{ marginBottom: 'var(--space-5)' }}
              >
                <label className="form-field__label">Venue</label>
                <input
                  className="input w-full"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Grand Ballroom, NYC"
                />
              </div>
              <div
                className="flex gap-3"
                style={{ justifyContent: 'flex-end' }}
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
                    <Spinner size={18} />
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

function EventCard({ event }: { event: Event }) {
  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="event-card card">
      <h3 style={{ marginBottom: 'var(--space-1)' }}>{event.name}</h3>
      <div
        className="text-secondary"
        style={{ marginBottom: 'var(--space-1)', fontSize: '0.875rem' }}
      >
        {formatDate(event.date) ?? 'Date TBD'}
        {event.time ? ` at ${event.time}` : ''}
      </div>
      <div
        className="text-muted"
        style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}
      >
        {event.venue ?? 'Venue TBD'}
      </div>
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
          to={`/events/${event.id}/check-in`}
          className="btn btn--secondary btn--sm"
        >
          Check-in
        </Link>
        <Link
          to={`/events/${event.id}/print`}
          className="btn btn--secondary btn--sm"
        >
          Print
        </Link>
      </div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
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
