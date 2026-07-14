import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { useRSVPByGuest, useUpsertRSVP } from '@/hooks/use-rsvps';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { RSVPStatus } from '@/types/rsvp';
import type { GuestWithTable } from '@/types/guest';

export function InvitationPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useGuestSearch(event?.id ?? '', searchQuery);
  const { data: selectedGuest } = useGuestById(
    event?.id ?? '',
    selectedGuestId,
  );
  const { data: existingRSVP } = useRSVPByGuest(
    event?.id ?? '',
    selectedGuestId,
  );
  const upsertRSVP = useUpsertRSVP(event?.id ?? '');

  const [status, setStatus] = useState<RSVPStatus>('attending');
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');

  const suggestions = useMemo<GuestWithTable[]>(() => {
    if (!searchQuery.trim()) return [];
    return searchResults.data ?? [];
  }, [searchResults.data, searchQuery]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (existingRSVP) {
      setStatus(existingRSVP.status);
      setPlusOnes(existingRSVP.plus_ones);
      setMessage(existingRSVP.message ?? '');
    }
  }, [existingRSVP]);

  if (isLoading) return <LoadingScreen message="Loading invitation..." />;
  if (error) return <ErrorScreen message={error.message} />;
  if (!event) return <ErrorScreen message="Event not found" />;
  if (!event.invitation_enabled) {
    return (
      <ErrorScreen message="Invitations are not enabled for this event." />
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const guest = suggestions[highlightIndex];
      if (guest) {
        selectGuest(guest);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectGuest = (guest: GuestWithTable) => {
    setSelectedGuestId(guest.id);
    setSearchQuery('');
    setShowSuggestions(false);
    setSubmitted(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedGuestId) return;

    try {
      await upsertRSVP.mutateAsync({
        guest_id: selectedGuestId,
        status,
        plus_ones: status === 'attending' ? plusOnes : 0,
        message: message.trim() || null,
      });
      setSubmitted(true);
    } catch {
      // Error handled by mutation state
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (submitted && selectedGuest) {
    return (
      <div className="invite-container">
        <div className="invite-rsvp-confirmation">
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}
          >
            <span style={{ fontSize: '2rem', color: 'var(--success)' }}>✓</span>
          </div>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>
            Thank you, {selectedGuest.name}!
          </h2>
          <p
            className="text-secondary"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            {status === 'attending'
              ? "Your RSVP has been received. We can't wait to celebrate with you!"
              : "Your response has been recorded. We'll miss you!"}
          </p>

          {status === 'attending' && selectedGuest.table && (
            <div
              className="card"
              style={{
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
                textAlign: 'center',
              }}
            >
              <p
                className="text-secondary"
                style={{
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Your Table
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                Table {selectedGuest.table.number}
              </p>
              {selectedGuest.table.name && (
                <p className="text-muted">{selectedGuest.table.name}</p>
              )}
            </div>
          )}

          {status === 'attending' && !selectedGuest.table && (
            <p
              className="text-muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              Your seat assignment will be available soon.
            </p>
          )}

          <Link to={`/e/${event.slug}`} className="btn btn--primary">
            Find Your Seat →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-hero">
        {event.venue && <p className="text-secondary">{event.venue}</p>}
        <h1 className="invite-title">{event.name}</h1>
        {event.date && (
          <p className="text-secondary">
            {formatDate(event.date)}
            {event.time ? ` at ${event.time}` : ''}
          </p>
        )}
      </div>

      {!selectedGuestId ? (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <p
            className="text-secondary"
            style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}
          >
            Find your name to RSVP
          </p>
          <input
            className="input invite-search-input w-full"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Type your name..."
            autoComplete="off"
            autoFocus
          />

          {showSuggestions && searchQuery.trim() && (
            <div className="invite-suggestions">
              {searchResults.isLoading && (
                <div
                  className="fys-suggestion"
                  style={{ justifyContent: 'center' }}
                >
                  <Spinner size={20} />
                </div>
              )}
              {!searchResults.isLoading && suggestions.length === 0 && (
                <div className="fys-suggestion text-muted">No guests found</div>
              )}
              {suggestions.map((guest, index) => (
                <button
                  key={guest.id}
                  type="button"
                  className={`fys-suggestion ${index === highlightIndex ? 'fys-suggestion--active' : ''}`}
                  onClick={() => selectGuest(guest)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span>{guest.name}</span>
                  {existingRSVP && guest.id === selectedGuestId && (
                    <span className="badge badge--info">RSVP'd</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : selectedGuest ? (
        <div className="invite-rsvp-card">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <p
              className="text-secondary"
              style={{
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Welcome
            </p>
            <h2>{selectedGuest.name}</h2>
            {existingRSVP && (
              <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
                You've already responded. Update your RSVP below.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="invite-rsvp-options">
              <button
                type="button"
                className={`invite-rsvp-option ${status === 'attending' ? 'invite-rsvp-option--active' : ''}`}
                onClick={() => setStatus('attending')}
              >
                <span style={{ fontSize: '1.5rem' }}>✓</span>
                <span>Joyfully Accepts</span>
              </button>
              <button
                type="button"
                className={`invite-rsvp-option ${status === 'not_attending' ? 'invite-rsvp-option--active' : ''}`}
                onClick={() => setStatus('not_attending')}
              >
                <span style={{ fontSize: '1.5rem' }}>✕</span>
                <span>Regretfully Declines</span>
              </button>
            </div>

            {status === 'attending' && (
              <div className="form-field">
                <label className="form-field__label">Plus Ones</label>
                <div className="flex gap-3" style={{ alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setPlusOnes((p) => Math.max(0, p - 1))}
                    disabled={plusOnes <= 0}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      minWidth: '40px',
                      textAlign: 'center',
                    }}
                  >
                    {plusOnes}
                  </span>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setPlusOnes((p) => p + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="form-field">
              <label className="form-field__label" htmlFor="message">
                Message (optional)
              </label>
              <textarea
                id="message"
                className="input w-full"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave a note for the host..."
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {upsertRSVP.isError && (
              <p
                style={{
                  color: 'var(--error)',
                  fontSize: '0.875rem',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Failed to submit RSVP. Please try again.
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary w-full"
              disabled={upsertRSVP.isPending}
              style={{ gap: 'var(--space-2)' }}
            >
              {upsertRSVP.isPending && <Spinner size={16} />}
              Submit RSVP
            </button>
          </form>

          <button
            type="button"
            className="btn btn--ghost btn--sm w-full"
            style={{ marginTop: 'var(--space-3)' }}
            onClick={() => {
              setSelectedGuestId(null);
              setSubmitted(false);
              setStatus('attending');
              setPlusOnes(0);
              setMessage('');
            }}
          >
            ← Back to search
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--space-8)',
          }}
        >
          <Spinner size={32} />
        </div>
      )}
    </div>
  );
}
