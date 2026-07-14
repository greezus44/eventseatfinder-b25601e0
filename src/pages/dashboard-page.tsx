import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Event } from '@/types/event';

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    try {
      await createEvent.mutateAsync({
        name: newName,
        slug: slugify(newName),
        date: newDate,
        time: '',
        venue: newVenue,
        invitation_enabled: false,
      });
      toast('Event created', 'success');
      setNewName('');
      setNewDate('');
      setNewVenue('');
      setShowForm(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to create event',
        'error',
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast('Event deleted', 'success');
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to delete event',
        'error',
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateStr: string) => {
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
    <div className="page">
      <div className="page__header">
        <h1>Your Events</h1>
        <button
          className="btn btn--primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'New Event'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <input
            className="input"
            placeholder="Event name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <input
            className="input"
            placeholder="Venue"
            value={newVenue}
            onChange={(e) => setNewVenue(e.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            Create
          </button>
        </form>
      )}

      {isLoading ? (
        <p>Loading events...</p>
      ) : !events || events.length === 0 ? (
        <p>No events yet. Create one to get started.</p>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <h2 className="event-card__title">{event.name}</h2>
              <p className="event-card__meta">{formatDate(event.date)}</p>
              <p className="event-card__meta">{event.venue || 'Venue TBD'}</p>
              {event.invitation_enabled && (
                <span className="badge">Invitations On</span>
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
                  className="btn btn--ghost btn--sm"
                >
                  Guests
                </Link>
                <Link
                  to={`/events/${event.id}/seating`}
                  className="btn btn--ghost btn--sm"
                >
                  Seating
                </Link>
                <Link
                  to={`/events/${event.id}/overview`}
                  className="btn btn--ghost btn--sm"
                >
                  Overview
                </Link>
                <Link
                  to={`/events/${event.id}/check-in`}
                  className="btn btn--ghost btn--sm"
                >
                  Check-in
                </Link>
                <Link
                  to={`/events/${event.id}/analytics`}
                  className="btn btn--ghost btn--sm"
                >
                  Analytics
                </Link>
                <Link
                  to={`/events/${event.id}/print`}
                  className="btn btn--ghost btn--sm"
                >
                  Print
                </Link>
                <Link
                  to={`/e/${event.slug}`}
                  className="btn btn--ghost btn--sm"
                >
                  Find Your Seat
                </Link>
                <Link
                  to={`/events/${event.id}/guest-page`}
                  className="btn btn--ghost btn--sm"
                >
                  Guest Page
                </Link>
                {event.invitation_enabled && (
                  <Link
                    to={`/invite/${event.slug}`}
                    className="btn btn--ghost btn--sm"
                  >
                    Invitation
                  </Link>
                )}
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setDeleteTarget(event)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Event"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
