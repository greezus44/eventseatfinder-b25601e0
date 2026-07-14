import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent, useUpdateEvent } from '@/hooks/use-events';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';
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
  const [invitationEnabled, setInvitationEnabled] = useState(false);

  const rsvpsQuery = useRSVPs(eventId ?? '');

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDate(event.date);
      setTime(event.time);
      setVenue(event.venue);
      setInvitationEnabled(event.invitation_enabled);
    }
  }, [event]);

  if (isLoading) return <div className="page">Loading...</div>;
  if (error || !event) return <div className="page">Event not found.</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        name,
        slug: event.slug,
        date,
        time,
        venue,
        invitation_enabled: invitationEnabled,
      });
      toast('Event settings saved', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
  };

  const rsvps = rsvpsQuery.data ?? [];
  const attending = rsvps.filter((r) => r.status === 'attending');
  const declined = rsvps.filter((r) => r.status === 'not_attending');
  const pending = rsvps.filter((r) => r.status === 'maybe');

  const statusLabel = (status: RSVPStatus) => {
    if (status === 'attending') return 'Attending';
    if (status === 'not_attending') return 'Not Attending';
    return 'Maybe';
  };

  const statusClass = (status: RSVPStatus) => {
    if (status === 'attending')
      return 'rsvp-item__badge rsvp-item__badge--attending';
    if (status === 'not_attending')
      return 'rsvp-item__badge rsvp-item__badge--declined';
    return 'rsvp-item__badge rsvp-item__badge--pending';
  };

  const publicUrl = `${window.location.origin}/invite/${event.slug}`;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Event Settings</h1>
      </div>

      <form className="card" onSubmit={handleSave}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="name">
            Event Name
          </label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-field__label" htmlFor="date">
              Date
            </label>
            <input
              id="date"
              className="input"
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
              className="input"
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
            className="input"
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
          <div className="form-field">
            <label className="form-field__label">Public Invitation Link</label>
            <div className="public-link">
              <span className="public-link__url">{publicUrl}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={updateEvent.isPending}
        >
          {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {invitationEnabled && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 16 }}>RSVP Tracking</h2>

          <div className="rsvp-stats">
            <div className="rsvp-stat rsvp-stat--attending">
              <span className="rsvp-stat__number">{attending.length}</span>
              <span className="rsvp-stat__label">Attending</span>
            </div>
            <div className="rsvp-stat rsvp-stat--declined">
              <span className="rsvp-stat__number">{declined.length}</span>
              <span className="rsvp-stat__label">Declined</span>
            </div>
            <div className="rsvp-stat rsvp-stat--pending">
              <span className="rsvp-stat__number">{pending.length}</span>
              <span className="rsvp-stat__label">Pending</span>
            </div>
          </div>

          {rsvps.length > 0 && (
            <div className="rsvp-list">
              {rsvps.map((rsvp) => (
                <div key={rsvp.id} className="rsvp-item">
                  <span className="rsvp-item__name">
                    {rsvp.guest.first_name} {rsvp.guest.last_name}
                  </span>
                  <span className={statusClass(rsvp.status)}>
                    {statusLabel(rsvp.status)}
                  </span>
                  {rsvp.plus_ones > 0 && (
                    <span className="rsvp-item__plus-ones">
                      +{rsvp.plus_ones} guest{rsvp.plus_ones > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
