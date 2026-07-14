import { useState, useEffect, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { RSVPStatus } from '@/types/rsvp';
import type { RSVPWithGuest } from '@/types/rsvp';

const STATUS_LABELS: Record<RSVPStatus, string> = {
  attending: 'Attending',
  not_attending: 'Declined',
  maybe: 'Maybe',
};

const STATUS_BADGE_CLASS: Record<RSVPStatus, string> = {
  attending: 'badge badge--success',
  not_attending: 'badge badge--error',
  maybe: 'badge badge--warning',
};

function RSVPStatsPanel({ eventId }: { eventId: string }) {
  const { data: rsvps, isLoading: rsvpLoading } = useRSVPs(eventId);
  const { data: guests, isLoading: guestLoading } = useGuests(eventId);

  if (rsvpLoading || guestLoading) {
    return (
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <Spinner size={24} />
      </div>
    );
  }

  const attending = rsvps?.filter((r) => r.status === 'attending').length ?? 0;
  const declined =
    rsvps?.filter((r) => r.status === 'not_attending').length ?? 0;
  const pending = (guests?.length ?? 0) - attending - declined;
  const plusOnes = rsvps?.reduce((sum, r) => sum + r.plus_ones, 0) ?? 0;

  const pendingGuests =
    guests?.filter((g) => !rsvps?.some((r) => r.guest_id === g.id)) ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <div className="rsvp-stats">
        <div className="rsvp-stat">
          <span className="rsvp-stat__value">{attending}</span>
          <span className="rsvp-stat__label">Attending</span>
        </div>
        <div className="rsvp-stat">
          <span className="rsvp-stat__value">{declined}</span>
          <span className="rsvp-stat__label">Declined</span>
        </div>
        <div className="rsvp-stat">
          <span className="rsvp-stat__value">{pending}</span>
          <span className="rsvp-stat__label">Pending</span>
        </div>
        <div className="rsvp-stat">
          <span className="rsvp-stat__value">{plusOnes}</span>
          <span className="rsvp-stat__label">Plus Ones</span>
        </div>
      </div>

      {rsvps && rsvps.length > 0 && (
        <div>
          <h4
            className="text-secondary"
            style={{
              marginBottom: 'var(--space-2)',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            RSVP Responses
          </h4>
          <div className="rsvp-list">
            {rsvps.map((rsvp: RSVPWithGuest) => (
              <div key={rsvp.id} className="rsvp-item">
                <span>{rsvp.guest.name}</span>
                <span className={STATUS_BADGE_CLASS[rsvp.status]}>
                  {STATUS_LABELS[rsvp.status]}
                  {rsvp.plus_ones > 0 && ` (+${rsvp.plus_ones})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingGuests.length > 0 && (
        <div>
          <h4
            className="text-secondary"
            style={{
              marginBottom: 'var(--space-2)',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Pending Guests ({pendingGuests.length})
          </h4>
          <div className="rsvp-list">
            {pendingGuests.map((g) => (
              <div key={g.id} className="rsvp-item">
                <span>{g.name}</span>
                <span className="badge badge--warning">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rsvps?.length === 0 && pendingGuests.length === 0 && (
        <p className="text-muted">
          No guests yet. Add guests from the Guests page.
        </p>
      )}
    </div>
  );
}

export function EventSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEvent(eventId ?? '');
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [invitationEnabled, setInvitationEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDate(event.date ?? '');
      setTime(event.time ?? '');
      setVenue(event.venue ?? '');
      setAccentColor(event.accent_color ?? '#4f46e5');
      setInvitationEnabled(event.invitation_enabled);
    }
  }, [event]);

  if (isLoading) return <LoadingScreen message="Loading event..." />;
  if (error) return <ErrorScreen message={error.message} />;
  if (!event) return <ErrorScreen message="Event not found" />;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      await updateEvent.mutateAsync({
        id: eventId,
        input: {
          name,
          date: date || null,
          time: time || null,
          venue: venue || null,
          accent_color: accentColor,
          invitation_enabled: invitationEnabled,
        },
      });
      toast('Event saved successfully', 'success');
    } catch {
      toast('Failed to save event', 'error');
    }
  };

  const invitationUrl = `${window.location.origin}/invite/${event.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    toast('Invitation link copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <Link
            to="/"
            className="btn btn--ghost btn--sm"
            style={{ marginBottom: 'var(--space-1)' }}
          >
            ← Back
          </Link>
          <h1>Event Settings</h1>
        </div>
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
            to={`/events/${eventId}/print`}
            className="btn btn--secondary btn--sm"
          >
            Print
          </Link>
        </div>
      </div>

      <div className="page__body">
        <form
          onSubmit={handleSave}
          className="card"
          style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}
        >
          <div className="form-field">
            <label className="form-field__label" htmlFor="name">
              Event Name
            </label>
            <input
              id="name"
              className="input w-full"
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
                className="input w-full"
                type="date"
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
                className="input w-full"
                type="time"
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
              className="input w-full"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Grand Ballroom Hotel"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="accent-color">
              Accent Color
            </label>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{
                  width: '48px',
                  height: '48px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              />
              <input
                className="input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ maxWidth: '140px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={updateEvent.isPending}
            style={{ gap: 'var(--space-2)' }}
          >
            {updateEvent.isPending && <Spinner size={16} />}
            Save Changes
          </button>
        </form>

        <div
          className="card"
          style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Invitations</h3>
          <label
            className="invite-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              cursor: 'pointer',
              marginBottom: 'var(--space-4)',
            }}
          >
            <input
              type="checkbox"
              checked={invitationEnabled}
              onChange={(e) => setInvitationEnabled(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span>Enable guest RSVP invitations</span>
          </label>

          {invitationEnabled && (
            <div className="public-link">
              <span className="public-link__url">{invitationUrl}</span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={handleCopyLink}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>RSVP Tracking</h3>
          <RSVPStatsPanel eventId={event.id} />
        </div>
      </div>
    </div>
  );
}
