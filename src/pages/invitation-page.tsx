import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch } from '@/hooks/use-guests';
import { useUpsertRSVP } from '@/hooks/use-rsvps';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';

type Screen = 'search' | 'rsvp' | 'confirmation';

export function InvitationPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');
  const upsertRSVP = useUpsertRSVP(event?.id ?? '');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithTable | null>(
    null,
  );
  const [screen, setScreen] = useState<Screen>('search');
  const [status, setStatus] = useState<RSVPStatus>('attending');
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const guestsQuery = useGuestSearch(event?.id ?? '', searchQuery);

  const handleSelectGuest = (guest: GuestWithTable) => {
    setSelectedGuest(guest);
    setScreen('rsvp');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || !event) return;
    setSubmitError(null);
    try {
      await upsertRSVP.mutateAsync({
        guest_id: selectedGuest.id,
        status,
        plus_ones: status === 'attending' ? plusOnes : 0,
        message: message || null,
      });
      setScreen('confirmation');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit RSVP',
      );
    }
  };

  const handleBack = () => {
    setSelectedGuest(null);
    setScreen('search');
    setSearchQuery('');
    setPlusOnes(0);
    setMessage('');
    setSubmitError(null);
  };

  if (isLoading) {
    return (
      <div className="invite-loading">
        <div className="invite-spinner" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="invite-container">
        <div className="invite-card--error">
          <p>Event not found or invitation is no longer available.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (screen === 'confirmation' && selectedGuest) {
    return (
      <div className="invite-container">
        <div className="invite-rsvp-confirmation">
          <div className="invite-rsvp-check">✓</div>
          <h2>Thank you, {selectedGuest.name}!</h2>
          <p>
            Your RSVP has been{' '}
            {status === 'attending' ? 'submitted' : 'recorded'}.
          </p>
          {selectedGuest.table && (
            <div className="invite-rsvp-table">
              <p className="invite-rsvp-table__label">Your Table</p>
              <p className="invite-rsvp-table__name">
                {selectedGuest.table.name}
              </p>
              <p className="invite-rsvp-table__number">
                Table #{selectedGuest.table.number}
              </p>
            </div>
          )}
          <button className="invite-rsvp-back" onClick={handleBack}>
            Submit another response
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'rsvp' && selectedGuest) {
    return (
      <div className="invite-container">
        <div className="invite-rsvp-card">
          <div className="invite-rsvp-greeting">
            <p className="invite-rsvp-name">Hi, {selectedGuest.name}!</p>
            <p className="invite-rsvp-event">{event.name}</p>
          </div>

          <form className="invite-rsvp-form" onSubmit={handleSubmit}>
            <div className="invite-rsvp-options">
              <label className="invite-rsvp-option invite-rsvp-option--attending">
                <input
                  type="radio"
                  name="rsvp"
                  value="attending"
                  checked={status === 'attending'}
                  onChange={() => setStatus('attending')}
                />
                <span className="invite-rsvp-label">Attending</span>
              </label>
              <label className="invite-rsvp-option invite-rsvp-option--not-attending">
                <input
                  type="radio"
                  name="rsvp"
                  value="not_attending"
                  checked={status === 'not_attending'}
                  onChange={() => setStatus('not_attending')}
                />
                <span className="invite-rsvp-label">Not Attending</span>
              </label>
            </div>

            {status === 'attending' && (
              <div className="invite-rsvp-field">
                <label className="invite-rsvp-label" htmlFor="plus-ones">
                  Plus Ones
                </label>
                <input
                  id="plus-ones"
                  className="input"
                  type="number"
                  min={0}
                  max={10}
                  value={plusOnes}
                  onChange={(e) =>
                    setPlusOnes(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>
            )}

            <div className="invite-rsvp-field">
              <label className="invite-rsvp-label" htmlFor="message">
                Message (optional)
              </label>
              <textarea
                id="message"
                className="input"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a note for the host..."
              />
            </div>

            {submitError && <p className="invite-rsvp-error">{submitError}</p>}

            <button
              type="submit"
              className="invite-rsvp-submit"
              disabled={upsertRSVP.isPending}
            >
              {upsertRSVP.isPending ? 'Submitting...' : 'Submit RSVP'}
            </button>
          </form>

          <button className="invite-rsvp-back" onClick={handleBack}>
            Back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-hero">
        {event.venue && <p className="invite-venue">{event.venue}</p>}
        <h1 className="invite-title">{event.name}</h1>
        <div className="invite-date-row">
          <span>{formatDate(event.date)}</span>
          {event.time && <span>{event.time}</span>}
        </div>
      </div>

      <div className="invite-search-section">
        <p className="invite-prompt">Find your name to RSVP</p>
        <div className="invite-search-wrap">
          <input
            className="invite-search-input"
            type="text"
            placeholder="Search your name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {guestsQuery.isFetching && <div className="invite-search-spinner" />}
        </div>

        {searchQuery.trim() && !guestsQuery.isFetching && (
          <div className="invite-suggestions">
            {guestsQuery.data && guestsQuery.data.length > 0 ? (
              guestsQuery.data.map((guest) => (
                <button
                  key={guest.id}
                  className="invite-suggestion"
                  onClick={() => handleSelectGuest(guest)}
                >
                  <span className="invite-suggestion__name">{guest.name}</span>
                  <span className="invite-suggestion__arrow">→</span>
                </button>
              ))
            ) : (
              <div className="invite-no-results">
                <p>No matches found. Check the spelling or contact the host.</p>
              </div>
            )}
          </div>
        )}

        <Link to={`/e/${event.slug}`} className="invite-find-seat-link">
          Find your seat →
        </Link>
      </div>
    </div>
  );
}
