import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useGuests } from '@/hooks/use-guests';
import { useToast } from '@/providers/toast-provider';
import { ErrorScreen, LoadingScreen, Spinner } from '@/components/ui/feedback';

export function EventSettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEvent(eventId ?? '');
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    accent_color: '#4f46e5',
    invitation_enabled: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        date: event.date ?? '',
        time: event.time ?? '',
        venue: event.venue ?? '',
        accent_color: event.accent_color ?? '#4f46e5',
        invitation_enabled: event.invitation_enabled,
      });
    }
  }, [event]);

  if (isLoading) return <LoadingScreen message="Loading event…" />;
  if (error)
    return <ErrorScreen message={error.message || 'Failed to load event'} />;
  if (!event) return <ErrorScreen message="Event not found" />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Event name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        input: {
          name: form.name.trim(),
          date: form.date || null,
          time: form.time || null,
          venue: form.venue.trim() || null,
          accent_color: form.accent_color,
          invitation_enabled: form.invitation_enabled,
        },
      });
      toast('Event saved', 'success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save event';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Link to="/" className="back-link">
            ← Back to events
          </Link>
          <h1>Event Settings</h1>
        </div>
        <div className="flex flex--gap-2">
          <Link
            to={`/events/${event.id}/guests`}
            className="btn btn--secondary"
          >
            Manage Guests
          </Link>
          <Link to={`/events/${event.id}/seating`} className="btn btn--primary">
            Seating
          </Link>
        </div>
      </header>

      <div className="card form-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="form-field__label">Event name</span>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              placeholder="Grand Ballroom"
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Accent color</span>
            <div className="color-picker">
              <input
                className="color-picker__input"
                type="color"
                value={form.accent_color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accent_color: e.target.value }))
                }
              />
              <input
                className="input color-picker__hex"
                value={form.accent_color}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accent_color: e.target.value }))
                }
              />
            </div>
          </label>

          <div className="form__actions">
            <button
              className="btn btn--primary"
              type="submit"
              disabled={saving}
            >
              {saving ? <Spinner size={18} /> : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card form-card">
        <h3>Digital Invitations</h3>
        <p className="text-secondary">
          Enable invitations to allow guests to RSVP online.
        </p>
        <label className="form-field invite-toggle">
          <input
            type="checkbox"
            checked={form.invitation_enabled}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                invitation_enabled: e.target.checked,
              }))
            }
          />
          <span>Enable digital invitations</span>
        </label>
        {form.invitation_enabled && (
          <div className="public-link" style={{ marginTop: 'var(--space-4)' }}>
            <code className="public-link__url">
              {window.location.origin}/invite/{event.slug}
            </code>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/invite/${event.slug}`,
                );
                toast('Invitation link copied', 'success');
              }}
            >
              Copy
            </button>
          </div>
        )}
      </div>

      <RSVPTracking eventId={event.id} />
    </div>
  );
}

function RSVPTracking({ eventId }: { eventId: string }) {
  const { data: rsvps, isLoading } = useRSVPs(eventId);
  const { data: guests } = useGuests(eventId);

  if (isLoading) return null;

  const attending = rsvps?.filter((r) => r.status === 'attending') ?? [];
  const declined = rsvps?.filter((r) => r.status === 'not_attending') ?? [];
  const rsvpedIds = new Set(rsvps?.map((r) => r.guest_id) ?? []);
  const pending = (guests ?? []).filter((g) => !rsvpedIds.has(g.id));
  const totalPlusOnes = attending.reduce(
    (sum, r) => sum + (r.plus_ones ?? 0),
    0,
  );

  if ((guests ?? []).length === 0) return null;

  return (
    <div className="card form-card">
      <h3>RSVP Tracking</h3>

      <div className="rsvp-stats">
        <div className="rsvp-stat rsvp-stat--attending">
          <div className="rsvp-stat__number">{attending.length}</div>
          <div className="rsvp-stat__label">Attending</div>
        </div>
        <div className="rsvp-stat rsvp-stat--declined">
          <div className="rsvp-stat__number">{declined.length}</div>
          <div className="rsvp-stat__label">Declined</div>
        </div>
        <div className="rsvp-stat rsvp-stat--pending">
          <div className="rsvp-stat__number">{pending.length}</div>
          <div className="rsvp-stat__label">Pending</div>
        </div>
        <div className="rsvp-stat">
          <div className="rsvp-stat__number">{totalPlusOnes}</div>
          <div className="rsvp-stat__label">Plus Ones</div>
        </div>
      </div>

      {rsvps && rsvps.length > 0 && (
        <div className="rsvp-list">
          {rsvps.map((rsvp) => (
            <div key={rsvp.id} className="rsvp-item">
              <span className="rsvp-item__name">{rsvp.guest.name}</span>
              <div className="rsvp-item__status">
                {rsvp.status === 'attending' && rsvp.plus_ones > 0 && (
                  <span className="rsvp-item__plus-ones">
                    +{rsvp.plus_ones}
                  </span>
                )}
                <span
                  className={`rsvp-item__badge rsvp-item__badge--${rsvp.status}`}
                >
                  {rsvp.status === 'attending'
                    ? 'Attending'
                    : rsvp.status === 'not_attending'
                      ? 'Declined'
                      : 'Maybe'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h4
            style={{
              marginTop: 'var(--space-5)',
              marginBottom: 'var(--space-3)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Awaiting Response
          </h4>
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
    </div>
  );
}
