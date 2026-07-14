import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch } from '@/hooks/use-guests';
import { useUpsertRSVP, useRSVPByGuest } from '@/hooks/use-rsvps';
import { Spinner } from '@/components/ui/feedback';
import type { RSVPStatus } from '@/types/rsvp';
import type { GuestWithTable } from '@/types/guest';

export function InvitationPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithTable | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="invite-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="invite-container">
        <div className="invite-card invite-card--error">
          <h1>Invitation Not Found</h1>
          <p>
            We couldn't find this event. Please check your link and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!event.invitation_enabled) {
    return (
      <div className="invite-container">
        <div className="invite-card invite-card--error">
          <h1>Invitations Not Available</h1>
          <p>Invitations for this event have not been enabled yet.</p>
        </div>
      </div>
    );
  }

  if (selectedGuest) {
    return (
      <RSVPForm
        eventId={event.id}
        eventName={event.name}
        guest={selectedGuest}
        onBack={() => setSelectedGuest(null)}
      />
    );
  }

  return (
    <GuestSelect
      eventId={event.id}
      eventName={event.name}
      eventDate={event.date}
      eventTime={event.time}
      eventVenue={event.venue}
      onSelect={setSelectedGuest}
    />
  );
}

function GuestSelect({
  eventId,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
  onSelect,
}: {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  eventTime: string | null;
  eventVenue: string | null;
  onSelect: (guest: GuestWithTable) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: results, isLoading: searching } = useGuestSearch(
    eventId,
    query,
  );

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const formattedTime = eventTime
    ? new Date(`2000-01-01T${eventTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="invite-container">
      <div className="invite-hero">
        {eventVenue && <p className="invite-venue">{eventVenue}</p>}
        <h1 className="invite-title">{eventName}</h1>
        <div className="invite-date-row">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedTime && <span> · {formattedTime}</span>}
        </div>
      </div>

      <div className="invite-search-section">
        <p className="invite-prompt">Find your name to RSVP</p>
        <div className="invite-search-wrap">
          <input
            type="text"
            className="invite-search-input"
            placeholder="Type your name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          {searching && (
            <span className="invite-search-spinner">
              <Spinner size={18} />
            </span>
          )}
        </div>

        {query.trim() && results && results.length > 0 && (
          <ul className="invite-suggestions">
            {results.map((guest) => (
              <li
                key={guest.id}
                className="invite-suggestion"
                onClick={() => onSelect(guest)}
              >
                <span className="invite-suggestion__name">{guest.name}</span>
                <span className="invite-suggestion__arrow">→</span>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && results && results.length === 0 && !searching && (
          <div className="invite-no-results">
            <p>No matches found.</p>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Try searching with just your first or last name.
            </p>
          </div>
        )}
      </div>

      <Link to={`/e/${eventSlugFromPath()}`} className="invite-find-seat-link">
        Find Your Seat Instead →
      </Link>
    </div>
  );
}

function eventSlugFromPath(): string {
  const parts = window.location.pathname.split('/');
  return parts[parts.length - 1] ?? '';
}

function RSVPForm({
  eventId,
  eventName,
  guest,
  onBack,
}: {
  eventId: string;
  eventName: string;
  guest: GuestWithTable;
  onBack: () => void;
}) {
  const { data: existingRSVP } = useRSVPByGuest(eventId, guest.id);
  const upsertRSVP = useUpsertRSVP(eventId);
  const [status, setStatus] = useState<RSVPStatus>(
    existingRSVP?.status ?? 'attending',
  );
  const [plusOnes, setPlusOnes] = useState(
    existingRSVP?.plus_ones?.toString() ?? '0',
  );
  const [message, setMessage] = useState(existingRSVP?.message ?? '');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (upsertRSVP.isPending) return;
    try {
      await upsertRSVP.mutateAsync({
        guest_id: guest.id,
        status,
        plus_ones: parseInt(plusOnes, 10) || 0,
        message: message.trim() || null,
      });
      setSubmitted(true);
    } catch {
      // error handled by toast
    }
  };

  if (submitted) {
    return (
      <div className="invite-container">
        <div className="invite-rsvp-confirmation">
          <div className="invite-rsvp-check">✓</div>
          <h2>Thank you, {guest.name}!</h2>
          <p className="text-secondary">
            {status === 'attending'
              ? `Your RSVP has been recorded. We can't wait to see you at ${eventName}!`
              : status === 'not_attending'
                ? `Your response has been recorded. We'll miss you at ${eventName}.`
                : `Your response has been recorded for ${eventName}.`}
          </p>
          {guest.table && (
            <div className="invite-rsvp-table">
              <p className="invite-rsvp-table__label">Your Table</p>
              <p className="invite-rsvp-table__number">{guest.table.number}</p>
              <p className="invite-rsvp-table__name">{guest.table.name}</p>
            </div>
          )}
          <Link
            to={`/e/${eventSlugFromPath()}`}
            className="btn btn--primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            Find Your Seat
          </Link>
          <button
            className="btn btn--ghost"
            style={{ marginTop: 'var(--space-3)' }}
            onClick={() => {
              setSubmitted(false);
              onBack();
            }}
          >
            ← Back to invitation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-rsvp-card">
        <p className="invite-rsvp-greeting">Welcome</p>
        <h2 className="invite-rsvp-name">{guest.name}</h2>
        <p className="invite-rsvp-event">{eventName}</p>

        <form onSubmit={handleSubmit} className="invite-rsvp-form">
          <div className="invite-rsvp-options">
            <button
              type="button"
              className={`invite-rsvp-option ${status === 'attending' ? 'invite-rsvp-option--active invite-rsvp-option--yes' : ''}`}
              onClick={() => setStatus('attending')}
            >
              <span className="invite-rsvp-option__icon">✓</span>
              <span>Joyfully Accepts</span>
            </button>
            <button
              type="button"
              className={`invite-rsvp-option ${status === 'not_attending' ? 'invite-rsvp-option--active invite-rsvp-option--no' : ''}`}
              onClick={() => setStatus('not_attending')}
            >
              <span className="invite-rsvp-option__icon">✕</span>
              <span>Regretfully Declines</span>
            </button>
          </div>

          {status === 'attending' && (
            <div className="invite-rsvp-plus-ones">
              <label htmlFor="plus-ones" className="invite-rsvp-label">
                Number of Plus Ones
              </label>
              <input
                id="plus-ones"
                type="number"
                className="input"
                value={plusOnes}
                onChange={(e) => setPlusOnes(e.target.value)}
                min={0}
                max={5}
              />
            </div>
          )}

          <div className="invite-rsvp-message">
            <label htmlFor="message" className="invite-rsvp-label">
              Message to the Host (optional)
            </label>
            <textarea
              id="message"
              className="input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send your well wishes…"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary invite-rsvp-submit"
            disabled={upsertRSVP.isPending}
          >
            {upsertRSVP.isPending ? <Spinner size={18} /> : null}
            Submit RSVP
          </button>

          {upsertRSVP.isError && (
            <p className="invite-rsvp-error">
              Failed to submit RSVP. Please try again.
            </p>
          )}
        </form>

        <button className="btn btn--ghost invite-rsvp-back" onClick={onBack}>
          ← Search again
        </button>
      </div>
    </div>
  );
}
