import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';

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
    invitation_enabled: false,
  });

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        date: event.date ?? '',
        time: event.time ?? '',
        venue: event.venue ?? '',
        invitation_enabled: event.invitation_enabled,
      });
    }
  }, [event]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId || updateEvent.isPending) return;
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        input: {
          name: form.name,
          date: form.date || null,
          time: form.time || null,
          venue: form.venue || null,
          invitation_enabled: form.invitation_enabled,
        },
      });
      toast('Event updated', 'success');
    } catch {
      toast('Failed to update event', 'error');
    }
  };

  if (isLoading) return <LoadingScreen message="Loading event…" />;
  if (error)
    return <ErrorScreen message="Failed to load event. Please try again." />;
  if (!event) return <ErrorScreen message="Event not found." />;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              ← Dashboard
            </Link>
          </div>
          <h1 style={{ marginTop: 'var(--space-2)' }}>{event.name}</h1>
          <p className="text-secondary">Event settings</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/events/${eventId}/guests`} className="btn btn--secondary">
            Manage Guests
          </Link>
        </div>
      </div>

      <div className="page__body">
        <form onSubmit={handleSubmit} className="card">
          <div className="form-grid">
            <div className="auth-form__field">
              <label htmlFor="name" className="auth-form__label">
                Event Name
              </label>
              <input
                id="name"
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={updateEvent.isPending}
              />
            </div>

            <div className="auth-form__field">
              <label htmlFor="venue" className="auth-form__label">
                Venue
              </label>
              <input
                id="venue"
                type="text"
                className="input"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g. Grand Ballroom, Hilton"
                disabled={updateEvent.isPending}
              />
            </div>

            <div className="auth-form__field">
              <label htmlFor="date" className="auth-form__label">
                Date
              </label>
              <input
                id="date"
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                disabled={updateEvent.isPending}
              />
            </div>

            <div className="auth-form__field">
              <label htmlFor="time" className="auth-form__label">
                Time
              </label>
              <input
                id="time"
                type="time"
                className="input"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                disabled={updateEvent.isPending}
              />
            </div>
          </div>

          <div
            className="auth-form__field"
            style={{ marginTop: 'var(--space-5)' }}
          >
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.invitation_enabled}
                onChange={(e) =>
                  setForm({ ...form, invitation_enabled: e.target.checked })
                }
                disabled={updateEvent.isPending}
              />
              <span>Enable digital invitation for guests</span>
            </label>
          </div>

          <div
            className="flex gap-3"
            style={{ marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}
          >
            <Link to="/" className="btn btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={updateEvent.isPending}
            >
              {updateEvent.isPending ? <Spinner size={18} /> : null}
              Save Changes
            </button>
          </div>
        </form>

        <div className="card" style={{ marginTop: 'var(--space-4)' }}>
          <h3 style={{ marginBottom: 'var(--space-3)' }}>Share Link</h3>
          <p
            className="text-secondary"
            style={{ marginBottom: 'var(--space-3)' }}
          >
            Share this link with guests so they can find their seat:
          </p>
          <div className="share-link">
            <span className="share-link__url">/e/{event.slug}</span>
            <button
              className="btn btn--secondary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/e/${event.slug}`,
                );
                toast('Link copied to clipboard', 'success');
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
