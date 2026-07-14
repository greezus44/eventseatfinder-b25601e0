import { useState, useEffect, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';
import { Spinner, ErrorScreen, LoadingScreen } from '@/components/ui/feedback';

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

  if (isLoading) return <LoadingScreen message="Loading event..." />;
  if (error) return <ErrorScreen message="Failed to load event" />;
  if (!event) return <ErrorScreen message="Event not found" />;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateEvent.mutateAsync({
        id: event.id,
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

  const handleCopyLink = () => {
    const url = `${window.location.origin}/invite/${event.slug}`;
    navigator.clipboard.writeText(url);
    toast('Invitation link copied!', 'success');
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to="/"
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            ← Back
          </Link>
          <h1>Event Settings</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/events/${event.id}/guests`}
            className="btn btn--secondary"
          >
            Manage Guests
          </Link>
          <Link
            to={`/events/${event.id}/seating`}
            className="btn btn--secondary"
          >
            Seating
          </Link>
          <Link
            to={`/events/${event.id}/overview`}
            className="btn btn--secondary"
          >
            Overview
          </Link>
        </div>
      </div>

      <div className="page__body">
        <form
          className="card"
          onSubmit={handleSave}
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <div className="form-field">
            <label className="form-field__label" htmlFor="name">
              Event Name
            </label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-field__label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="time">
                Time
              </label>
              <input
                id="time"
                type="time"
                className="input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="venue">
              Venue
            </label>
            <input
              id="venue"
              type="text"
              className="input"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="accent">
              Accent Color
            </label>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <input
                id="accent"
                type="color"
                className="input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: 60, height: 40, padding: 4 }}
              />
              <span className="text-secondary">{accentColor}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={updateEvent.isPending}
            style={{ marginTop: 'var(--space-4)' }}
          >
            {updateEvent.isPending ? <Spinner size={20} /> : 'Save Changes'}
          </button>
        </form>

        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Invitation</h3>
          <label
            className="invite-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={invitationEnabled}
              onChange={(e) => setInvitationEnabled(e.target.checked)}
              style={{ width: 20, height: 20 }}
            />
            <span>Enable guest invitations & RSVP tracking</span>
          </label>

          {invitationEnabled && (
            <div
              className="public-link"
              style={{ marginTop: 'var(--space-4)' }}
            >
              <span className="public-link__url">
                {window.location.origin}/invite/{event.slug}
              </span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleCopyLink}
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
  const { data: rsvps, isLoading: rsvpLoading } = useRSVPs(eventId);
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);

  if (rsvpLoading || guestsLoading) {
    return (
      <div className="card">
        <Spinner size={24} />
      </div>
    );
  }

  const attending = (rsvps ?? []).filter((r) => r.status === 'attending');
  const declined = (rsvps ?? []).filter((r) => r.status === 'not_attending');
  const pending = (guests ?? []).filter(
    (g) => !(rsvps ?? []).some((r) => r.guest_id === g.id),
  );
  const totalPlusOnes = attending.reduce((sum, r) => sum + r.plus_ones, 0);

  const statusBadge = (status: string): string => {
    if (status === 'attending')
      return 'rsvp-item__badge rsvp-item__badge--attending';
    if (status === 'not_attending')
      return 'rsvp-item__badge rsvp-item__badge--declined';
    return 'rsvp-item__badge';
  };

  const statusLabel = (status: string): string => {
    if (status === 'attending') return 'Attending';
    if (status === 'not_attending') return 'Declined';
    return 'Maybe';
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 'var(--space-4)' }}>RSVP Tracking</h3>

      <div className="rsvp-stats" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="rsvp-stat">
          <div className="rsvp-stat__number">{attending.length}</div>
          <div className="rsvp-stat__label">Attending</div>
        </div>
        <div className="rsvp-stat">
          <div className="rsvp-stat__number">{declined.length}</div>
          <div className="rsvp-stat__label">Declined</div>
        </div>
        <div className="rsvp-stat">
          <div className="rsvp-stat__number">{pending.length}</div>
          <div className="rsvp-stat__label">Pending</div>
        </div>
        <div className="rsvp-stat">
          <div className="rsvp-stat__number">{totalPlusOnes}</div>
          <div className="rsvp-stat__label">Plus Ones</div>
        </div>
      </div>

      {(rsvps ?? []).length > 0 && (
        <>
          <h4 style={{ marginBottom: 'var(--space-3)' }}>RSVP Responses</h4>
          <div className="rsvp-list" style={{ marginBottom: 'var(--space-5)' }}>
            {(rsvps ?? []).map((rsvp) => (
              <div key={rsvp.id} className="rsvp-item">
                <span className="rsvp-item__name">{rsvp.guest.name}</span>
                <div className="flex gap-3" style={{ alignItems: 'center' }}>
                  {rsvp.plus_ones > 0 && (
                    <span className="rsvp-item__plus-ones text-muted">
                      +{rsvp.plus_ones}
                    </span>
                  )}
                  <span className={statusBadge(rsvp.status)}>
                    {statusLabel(rsvp.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pending.length > 0 && (
        <>
          <h4 style={{ marginBottom: 'var(--space-3)' }}>Pending Guests</h4>
          <div className="rsvp-list">
            {pending.map((guest) => (
              <div key={guest.id} className="rsvp-item">
                <span className="rsvp-item__name">{guest.name}</span>
                <span className="rsvp-item__badge rsvp-item__badge--pending">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {(rsvps ?? []).length === 0 && pending.length === 0 && (
        <p className="text-secondary">
          No guests yet. Add guests from the Guest Management page.
        </p>
      )}
    </div>
  );
}
