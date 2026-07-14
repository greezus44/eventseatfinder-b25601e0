import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { RSVPStatus, RSVPWithGuest } from '@/types/rsvp';

const STATUS_LABELS: Record<RSVPStatus, string> = {
  attending: 'Attending',
  not_attending: 'Not Attending',
  maybe: 'Maybe',
};

function countByStatus(rsvps: RSVPWithGuest[]) {
  let attending = 0;
  let declined = 0;
  let maybe = 0;
  for (const r of rsvps) {
    if (r.status === 'attending') attending++;
    else if (r.status === 'not_attending') declined++;
    else if (r.status === 'maybe') maybe++;
  }
  const pending = 0;
  return { attending, declined, maybe, pending };
}

export function EventSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();

  const { data: rsvps } = useRSVPs(id);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [invitationEnabled, setInvitationEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !event) return;
    setName(event.name);
    setDate(event.date ?? '');
    setTime(event.time ?? '');
    setVenue(event.venue ?? '');
    setInvitationEnabled(event.invitation_enabled);
    setInitialized(true);
  }, [event, initialized]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateEvent.mutateAsync({
        id,
        name,
        slug: event?.slug ?? '',
        date: date || null,
        time: time || null,
        venue: venue || null,
        invitation_enabled: invitationEnabled,
      });
      toast('Event saved', 'success');
    } catch {
      toast('Could not save event', 'error');
    }
  }

  if (isLoading) return <LoadingScreen label="Loading event…" />;

  if (!event) {
    return (
      <div className="page">
        <ErrorScreen message="Event not found" />
        <Link to="/" className="btn btn--secondary btn--sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const stats = rsvps ? countByStatus(rsvps) : null;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>Event Settings</h1>
          <p className="text-secondary">{event.name}</p>
        </div>
        <Link to="/" className="btn btn--ghost btn--sm">
          Back
        </Link>
      </div>

      <form className="card" onSubmit={handleSave}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="event-name">
            Event name
          </label>
          <input
            id="event-name"
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-field__label" htmlFor="event-date">
              Date
            </label>
            <input
              id="event-date"
              className="input"
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
              className="input"
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
            className="input"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label className="invite-toggle">
            <input
              type="checkbox"
              checked={invitationEnabled}
              onChange={(e) => setInvitationEnabled(e.target.checked)}
            />
            Enable guest RSVP invitations
          </label>
        </div>

        {invitationEnabled && (
          <div className="public-link">
            <label className="form-field__label">Public invitation link</label>
            <div className="public-link__url">
              {window.location.origin}/invite/{event.slug}
            </div>
          </div>
        )}

        <button
          className="btn btn--primary"
          type="submit"
          disabled={updateEvent.isPending}
        >
          {updateEvent.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {invitationEnabled && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>RSVP Tracking</h2>

          {stats && (
            <div className="rsvp-stats">
              <div className="rsvp-stat rsvp-stat--attending">
                <div className="rsvp-stat__number">{stats.attending}</div>
                <div className="rsvp-stat__label">Attending</div>
              </div>
              <div className="rsvp-stat rsvp-stat--declined">
                <div className="rsvp-stat__number">{stats.declined}</div>
                <div className="rsvp-stat__label">Declined</div>
              </div>
              <div className="rsvp-stat">
                <div className="rsvp-stat__number">{stats.maybe}</div>
                <div className="rsvp-stat__label">Maybe</div>
              </div>
              <div className="rsvp-stat rsvp-stat--pending">
                <div className="rsvp-stat__number">{stats.pending}</div>
                <div className="rsvp-stat__label">Pending</div>
              </div>
            </div>
          )}

          {rsvps && rsvps.length > 0 && (
            <div className="rsvp-list">
              {rsvps.map((rsvp) => (
                <div key={rsvp.id} className="rsvp-item">
                  <span className="rsvp-item__name">{rsvp.guest.name}</span>
                  <span
                    className={`rsvp-item__status rsvp-item__badge rsvp-item__badge--${rsvp.status}`}
                  >
                    {STATUS_LABELS[rsvp.status]}
                  </span>
                  <span className="rsvp-item__plus-ones">
                    +{rsvp.plus_ones} guest{rsvp.plus_ones === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(!rsvps || rsvps.length === 0) && (
            <p className="text-secondary">No RSVPs yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
