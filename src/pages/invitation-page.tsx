import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { useUpsertRSVP } from '@/hooks/use-rsvps';
import { Spinner, ErrorScreen, LoadingScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';

export function InvitationPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const { data: suggestions, isFetching } = useGuestSearch(
    event?.id ?? '',
    search,
  );
  const { data: selectedGuest } = useGuestById(
    event?.id ?? '',
    selectedGuestId,
  );

  if (isLoading) return <LoadingScreen message="Loading invitation..." />;
  if (error) return <ErrorScreen message="Failed to load invitation" />;
  if (!event) return <ErrorScreen message="Event not found" />;
  if (!event.invitation_enabled) {
    return (
      <ErrorScreen message="Invitations are not enabled for this event." />
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const list = suggestions ?? [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((prev) => Math.min(prev + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (list[activeIndex]) {
        selectGuest(list[activeIndex]);
      } else if (list.length > 0) {
        selectGuest(list[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const selectGuest = (guest: GuestWithTable) => {
    setSelectedGuestId(guest.id);
    setShowSuggestions(false);
    setSearch(guest.name);
    setActiveIndex(-1);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Date TBA';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="invite-container">
      <div className="invite-hero">
        <div className="fys-venue">{event.venue ?? 'Venue TBA'}</div>
        <h1 className="invite-title">{event.name}</h1>
        <div className="fys-date">
          {formatDate(event.date)}
          {event.time ? ` at ${event.time}` : ''}
        </div>
      </div>

      {!selectedGuest ? (
        <div className="invite-search">
          <label
            htmlFor="invite-search"
            className="text-secondary"
            style={{ display: 'block', marginBottom: 'var(--space-2)' }}
          >
            Find your name to RSVP
          </label>
          <input
            id="invite-search"
            type="text"
            className="invite-search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Start typing your name..."
            autoComplete="off"
            autoFocus
          />

          {showSuggestions && search.trim() && (
            <div className="invite-suggestions">
              {isFetching ? (
                <div
                  className="fys-suggestion text-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  <Spinner size={20} />
                </div>
              ) : (suggestions ?? []).length === 0 ? (
                <div
                  className="fys-suggestion text-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  No matching guests found
                </div>
              ) : (
                (suggestions ?? []).map((guest, idx) => (
                  <button
                    key={guest.id}
                    type="button"
                    className={`fys-suggestion ${idx === activeIndex ? 'fys-suggestion--active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectGuest(guest);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    {guest.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <RSVPForm
          guest={selectedGuest}
          eventId={event.id}
          eventSlug={event.slug}
        />
      )}
    </div>
  );
}

function RSVPForm({
  guest,
  eventId,
  eventSlug,
}: {
  guest: GuestWithTable;
  eventId: string;
  eventSlug: string;
}) {
  const upsertRSVP = useUpsertRSVP(eventId);
  const [status, setStatus] = useState<RSVPStatus | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!status) return;
    try {
      await upsertRSVP.mutateAsync({
        guest_id: guest.id,
        status,
        plus_ones: status === 'attending' ? plusOnes : 0,
        message: message.trim() || null,
      });
      setSubmitted(true);
    } catch {
      // Error handled by mutation state
    }
  };

  if (submitted) {
    return (
      <div className="invite-rsvp-card">
        <div className="invite-rsvp-confirmation">
          <div className="invite-rsvp-confirmation__check">✓</div>
          {status === 'attending' ? (
            <>
              <h2>See you there, {guest.name.split(' ')[0]}!</h2>
              <p
                className="text-secondary"
                style={{ marginTop: 'var(--space-2)' }}
              >
                Your response has been recorded. We can't wait to celebrate with
                you!
              </p>
              {guest.table && (
                <div
                  className="fys-table-card"
                  style={{ marginTop: 'var(--space-5)' }}
                >
                  <div className="fys-table-card__number">
                    {guest.table.number}
                  </div>
                  <div className="fys-table-card__label">Your Table</div>
                  {guest.table.name && (
                    <div
                      className="text-muted"
                      style={{ marginTop: 'var(--space-2)' }}
                    >
                      {guest.table.name}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <h2>We'll miss you, {guest.name.split(' ')[0]}</h2>
              <p
                className="text-secondary"
                style={{ marginTop: 'var(--space-2)' }}
              >
                Thank you for letting us know. Your response has been recorded.
              </p>
            </>
          )}
          <Link
            to={`/e/${eventSlug}`}
            className="btn btn--primary"
            style={{ marginTop: 'var(--space-5)' }}
          >
            Find Your Seat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-rsvp-card">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>Hi, {guest.name}!</h2>
        <p className="text-secondary">Will you be joining us?</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="invite-rsvp-options">
          <button
            type="button"
            className={`invite-rsvp-option ${status === 'attending' ? 'invite-rsvp-option--active' : ''}`}
            onClick={() => setStatus('attending')}
          >
            <div className="invite-rsvp-option__icon">🎉</div>
            <div className="invite-rsvp-option__label">Joyfully Accepts</div>
          </button>
          <button
            type="button"
            className={`invite-rsvp-option ${status === 'not_attending' ? 'invite-rsvp-option--active' : ''}`}
            onClick={() => setStatus('not_attending')}
          >
            <div className="invite-rsvp-option__icon">💌</div>
            <div className="invite-rsvp-option__label">
              Regretfully Declines
            </div>
          </button>
        </div>

        {status === 'attending' && (
          <div className="form-field" style={{ marginTop: 'var(--space-5)' }}>
            <label className="form-field__label">Plus Ones: {plusOnes}</label>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setPlusOnes((p) => Math.max(0, p - 1))}
              >
                −
              </button>
              <input
                type="range"
                min={0}
                max={5}
                value={plusOnes}
                onChange={(e) => setPlusOnes(parseInt(e.target.value, 10))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setPlusOnes((p) => Math.min(5, p + 1))}
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="form-field" style={{ marginTop: 'var(--space-4)' }}>
          <label className="form-field__label" htmlFor="rsvp-message">
            Message (optional)
          </label>
          <textarea
            id="rsvp-message"
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a note for the host..."
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {upsertRSVP.isError && (
          <div
            className="auth-form__error"
            style={{ marginTop: 'var(--space-3)' }}
          >
            Failed to submit RSVP. Please try again.
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary w-full"
          disabled={!status || upsertRSVP.isPending}
          style={{ marginTop: 'var(--space-5)' }}
        >
          {upsertRSVP.isPending ? <Spinner size={20} /> : 'Submit RSVP'}
        </button>
      </form>
    </div>
  );
}
