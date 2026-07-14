import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch } from '@/hooks/use-guests';
import { useUpsertRSVP } from '@/hooks/use-rsvps';
import { Spinner, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';

type Phase = 'search' | 'form' | 'confirmation';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InvitationPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const slug = eventSlug ?? '';

  const { data: event, isLoading, isError } = useEventBySlug(slug);

  const [phase, setPhase] = useState<Phase>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithTable | null>(
    null,
  );
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const eventId = event?.id ?? '';
  const { data: searchResults, isFetching: searchFetching } = useGuestSearch(
    eventId,
    searchQuery,
  );
  const upsertRSVP = useUpsertRSVP(eventId);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
  }

  function selectGuest(guest: GuestWithTable) {
    setSelectedGuest(guest);
    setRsvpStatus(null);
    setPlusOnes(0);
    setMessage('');
    setSubmitError(null);
    setPhase('form');
  }

  async function handleSubmitRSVP(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGuest || !rsvpStatus) return;
    setSubmitError(null);
    try {
      await upsertRSVP.mutateAsync({
        guest_id: selectedGuest.id,
        status: rsvpStatus,
        plus_ones: plusOnes,
        message: message || null,
      });
      setPhase('confirmation');
    } catch {
      setSubmitError('Could not submit RSVP. Please try again.');
    }
  }

  function resetToSearch() {
    setPhase('search');
    setSelectedGuest(null);
    setRsvpStatus(null);
    setPlusOnes(0);
    setMessage('');
    setSubmitError(null);
    setSearchQuery('');
  }

  if (isLoading) {
    return (
      <div className="invite-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="invite-container">
        <div className="invite-card--error">
          <ErrorScreen message="Event not found" />
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-hero">
        {event.venue && <div className="invite-venue">{event.venue}</div>}
        <h1 className="invite-title">{event.name}</h1>
        <div className="invite-date-row">{formatDate(event.date)}</div>
      </div>

      {phase === 'search' && (
        <div className="invite-search-section">
          <p className="invite-prompt">Find your name to RSVP</p>
          <form className="invite-search-wrap" onSubmit={handleSearch}>
            <input
              className="invite-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type your name…"
              autoFocus
            />
            {searchFetching && (
              <span className="invite-search-spinner">
                <Spinner size={20} />
              </span>
            )}
          </form>

          {searchQuery &&
            !searchFetching &&
            searchResults &&
            searchResults.length === 0 && (
              <div className="invite-no-results">
                No matching guests found. Check the spelling or contact the
                event organizer.
              </div>
            )}

          {searchResults && searchResults.length > 0 && (
            <div className="invite-suggestions">
              {searchResults.map((guest) => (
                <button
                  key={guest.id}
                  className="invite-suggestion"
                  onClick={() => selectGuest(guest)}
                >
                  <span className="invite-suggestion__name">{guest.name}</span>
                  <span className="invite-suggestion__arrow">→</span>
                </button>
              ))}
            </div>
          )}

          <Link to={`/e/${event.slug}`} className="invite-find-seat-link">
            Already RSVP'd? Find your seat
          </Link>
        </div>
      )}

      {phase === 'form' && selectedGuest && (
        <div className="invite-rsvp-card">
          <div className="invite-rsvp-greeting">Hello,</div>
          <div className="invite-rsvp-name">{selectedGuest.name}</div>
          <div className="invite-rsvp-event">{event.name}</div>

          <form className="invite-rsvp-form" onSubmit={handleSubmitRSVP}>
            <div className="invite-rsvp-options">
              <button
                type="button"
                className={`invite-rsvp-option invite-rsvp-option--yes ${rsvpStatus === 'attending' ? 'invite-rsvp-option--active' : ''}`}
                onClick={() => setRsvpStatus('attending')}
              >
                <span className="invite-rsvp-option__icon">✓</span>
                <span className="invite-rsvp-label">Attending</span>
              </button>
              <button
                type="button"
                className={`invite-rsvp-option invite-rsvp-option--no ${rsvpStatus === 'not_attending' ? 'invite-rsvp-option--active' : ''}`}
                onClick={() => setRsvpStatus('not_attending')}
              >
                <span className="invite-rsvp-option__icon">✕</span>
                <span className="invite-rsvp-label">Not Attending</span>
              </button>
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="plus-ones">
                Plus ones
              </label>
              <input
                id="plus-ones"
                className="input"
                type="number"
                min={0}
                value={plusOnes}
                onChange={(e) =>
                  setPlusOnes(Math.max(0, Number(e.target.value)))
                }
              />
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="rsvp-message">
                Message (optional)
              </label>
              <textarea
                id="rsvp-message"
                className="input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {submitError && (
              <div className="invite-rsvp-error">{submitError}</div>
            )}

            <button
              className="btn btn--primary invite-rsvp-submit"
              type="submit"
              disabled={!rsvpStatus || upsertRSVP.isPending}
            >
              {upsertRSVP.isPending ? 'Submitting…' : 'Submit RSVP'}
            </button>
          </form>

          <button
            className="btn btn--ghost invite-rsvp-back"
            onClick={resetToSearch}
          >
            ← Back to search
          </button>
        </div>
      )}

      {phase === 'confirmation' && selectedGuest && (
        <div className="invite-rsvp-confirmation">
          <div className="invite-rsvp-check">✓</div>
          <h2>Thank you, {selectedGuest.name}!</h2>
          <p>
            Your RSVP status:{' '}
            <strong>
              {rsvpStatus === 'attending' ? 'Attending' : 'Not Attending'}
            </strong>
          </p>

          {rsvpStatus === 'attending' && selectedGuest.table && (
            <div className="invite-rsvp-table">
              <div className="invite-rsvp-table__label">Your table</div>
              <div className="invite-rsvp-table__number">
                Table {selectedGuest.table.number}
              </div>
              <div className="invite-rsvp-table__name">
                {selectedGuest.table.name}
              </div>
            </div>
          )}

          {rsvpStatus === 'attending' && !selectedGuest.table && (
            <p className="text-secondary">
              Your table assignment will be available soon.
            </p>
          )}

          <Link to={`/e/${event.slug}`} className="btn btn--primary">
            Find your seat
          </Link>

          <button
            className="btn btn--ghost invite-rsvp-back"
            onClick={resetToSearch}
          >
            ← RSVP for someone else
          </button>
        </div>
      )}
    </div>
  );
}
