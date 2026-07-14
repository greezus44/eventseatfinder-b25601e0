import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';
import { Spinner, LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { RSVPStatus } from '@/types/rsvp';

export function EventSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEvent(eventId ?? '');
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [invitationEnabled, setInvitationEnabled] = useState(false);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDate(event.date ?? '');
      setTime(event.time ?? '');
      setVenue(event.venue ?? '');
      setAccentColor(event.accent_color ?? '#6366f1');
      setInvitationEnabled(event.invitation_enabled);
    }
  }, [event]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !event) return;
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        input: {
          name: name.trim(),
          date: date || null,
          time: time || null,
          venue: venue.trim() || null,
          accent_color: accentColor,
          invitation_enabled: invitationEnabled,
        },
      });
      toast('Event saved successfully', 'success');
    } catch {
      toast('Failed to save event', 'error');
    }
  };

  const copyInvitationLink = () => {
    if (!event) return;
    const url = `${window.location.origin}/invite/${event.slug}`;
    navigator.clipboard.writeText(url).then(
      () => toast('Invitation link copied', 'success'),
      () => toast('Failed to copy link', 'error'),
    );
  };

  if (isLoading) return <LoadingScreen message="Loading event..." />;
  if (error) return <ErrorScreen message="Failed to load event." />;
  if (!event) return <ErrorScreen message="Event not found." />;

  return (
    <div className="page">
      <div className="page__header">
        <Link
          to="/"
          className="text-secondary"
          style={{
            fontSize: '0.875rem',
            marginBottom: 'var(--space-2)',
            display: 'inline-block',
          }}
        >
          ← Back to Dashboard
        </Link>
        <h1>Event Settings</h1>
      </div>
      <div className="page__body">
        <form onSubmit={handleSave} style={{ marginBottom: 'var(--space-6)' }}>
          <div
            className="card"
            style={{
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-4)',
            }}
          >
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
              style={{ marginBottom: 'var(--space-3)' }}
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
              className="form-field"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <label className="form-field__label">Accent Color</label>
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{
                    width: 48,
                    height: 40,
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                />
                <input
                  className="input"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: 120 }}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={updateEvent.isPending}
            >
              {updateEvent.isPending ? <Spinner size={18} /> : 'Save Changes'}
            </button>
          </div>
        </form>

        <div
          className="card"
          style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Quick Links</h3>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <Link
              to={`/events/${eventId}/guests`}
              className="btn btn--secondary btn--sm"
            >
              Manage Guests
            </Link>
            <Link
              to={`/events/${eventId}/seating`}
              className="btn btn--secondary btn--sm"
            >
              Seating
            </Link>
            <Link
              to={`/events/${eventId}/overview`}
              className="btn btn--secondary btn--sm"
            >
              Overview
            </Link>
            <Link
              to={`/events/${eventId}/check-in`}
              className="btn btn--secondary btn--sm"
            >
              Check-in
            </Link>
            <Link
              to={`/events/${eventId}/print`}
              className="btn btn--secondary btn--sm"
            >
              Print
            </Link>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Invitations</h3>
          <div
            className="invite-toggle"
            style={{ marginBottom: 'var(--space-3)' }}
          >
            <label
              className="flex gap-2"
              style={{ alignItems: 'center', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={invitationEnabled}
                onChange={(e) => setInvitationEnabled(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Enable guest invitations & RSVP</span>
            </label>
          </div>
          {invitationEnabled && (
            <div className="public-link">
              <span className="public-link__url">
                {window.location.origin}/invite/{event.slug}
              </span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={copyInvitationLink}
              >
                Copy Link
              </button>
            </div>
          )}
        </div>

        <RSVPTrackingPanel eventId={event.id} />
      </div>
    </div>
  );
}

function RSVPTrackingPanel({ eventId }: { eventId: string }) {
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);
  const { data: rsvps, isLoading: rsvpsLoading } = useRSVPs(eventId);

  const stats = useMemo(() => {
    const attending =
      rsvps?.filter((r) => r.status === 'attending').length ?? 0;
    const declined =
      rsvps?.filter((r) => r.status === 'not_attending').length ?? 0;
    const pending = (guests?.length ?? 0) - attending - declined;
    const plusOnes =
      rsvps?.reduce((sum, r) => sum + (r.plus_ones ?? 0), 0) ?? 0;
    return { attending, declined, pending, plusOnes };
  }, [rsvps, guests]);

  if (guestsLoading || rsvpsLoading) {
    return (
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <Spinner size={24} />
      </div>
    );
  }

  const rsvpGuestIds = new Set(rsvps?.map((r) => r.guest_id) ?? []);
  const pendingGuests = guests?.filter((g) => !rsvpGuestIds.has(g.id)) ?? [];

  const statusLabel: Record<RSVPStatus, string> = {
    attending: 'Attending',
    not_attending: 'Declined',
    maybe: 'Maybe',
  };

  const statusColor: Record<RSVPStatus, string> = {
    attending: 'var(--success, #16a34a)',
    not_attending: 'var(--error, #dc2626)',
    maybe: 'var(--warning, #f59e0b)',
  };

  return (
    <div className="card" style={{ padding: 'var(--space-5)' }}>
      <h3 style={{ marginBottom: 'var(--space-4)' }}>RSVP Tracking</h3>
      <div className="rsvp-stats" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="rsvp-stat">
          <div
            className="text-muted"
            style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
          >
            Attending
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--success, #16a34a)',
            }}
          >
            {stats.attending}
          </div>
        </div>
        <div className="rsvp-stat">
          <div
            className="text-muted"
            style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
          >
            Declined
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--error, #dc2626)',
            }}
          >
            {stats.declined}
          </div>
        </div>
        <div className="rsvp-stat">
          <div
            className="text-muted"
            style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
          >
            Pending
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {stats.pending}
          </div>
        </div>
        <div className="rsvp-stat">
          <div
            className="text-muted"
            style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
          >
            Plus Ones
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {stats.plusOnes}
          </div>
        </div>
      </div>

      {rsvps && rsvps.length > 0 && (
        <>
          <h4 style={{ marginBottom: 'var(--space-2)' }}>Responses</h4>
          <div className="rsvp-list" style={{ marginBottom: 'var(--space-4)' }}>
            {rsvps.map((rsvp) => (
              <div
                key={rsvp.id}
                className="rsvp-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{rsvp.guest.name}</span>
                  {rsvp.plus_ones > 0 && (
                    <span
                      className="text-muted"
                      style={{
                        fontSize: '0.875rem',
                        marginLeft: 'var(--space-2)',
                      }}
                    >
                      +{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span
                  className="badge"
                  style={{
                    background: statusColor[rsvp.status],
                    color: '#fff',
                  }}
                >
                  {statusLabel[rsvp.status]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {pendingGuests.length > 0 && (
        <>
          <h4 style={{ marginBottom: 'var(--space-2)' }}>
            Pending ({pendingGuests.length})
          </h4>
          <div className="rsvp-list">
            {pendingGuests.map((guest) => (
              <div
                key={guest.id}
                className="rsvp-item"
                style={{
                  padding: 'var(--space-2) 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span>{guest.name}</span>
                <span
                  className="text-muted"
                  style={{ fontSize: '0.875rem', marginLeft: 'var(--space-2)' }}
                >
                  Awaiting response
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {rsvps?.length === 0 && pendingGuests.length === 0 && (
        <p className="text-muted">
          No guests yet. Add guests from the Manage Guests page.
        </p>
      )}
    </div>
  );
}
