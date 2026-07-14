import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { useRSVPByGuest, useUpsertRSVP } from '@/hooks/use-rsvps';
import { useToast } from '@/providers/toast-provider';
import { Spinner, LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';

export function InvitationPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: searchResults, isLoading: searching } = useGuestSearch(
    event?.id ?? '',
    query,
  );
  const { data: selectedGuest } = useGuestById(
    event?.id ?? '',
    selectedGuestId,
  );

  const suggestions = searchResults ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(
        (i) => (i - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlightIndex]) {
        selectGuest(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectGuest = (guest: GuestWithTable) => {
    setSelectedGuestId(guest.id);
    setQuery(guest.name);
    setShowSuggestions(false);
    setSubmitted(false);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setShowSuggestions(false), 150);
  };

  const resetSearch = () => {
    setQuery('');
    setSelectedGuestId(null);
    setSubmitted(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  if (isLoading) return <LoadingScreen message="Loading invitation..." />;
  if (error) return <ErrorScreen message="Failed to load event." />;
  if (!event) return <ErrorScreen message="Event not found." />;
  if (!event.invitation_enabled) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div
          className="card"
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <h2 style={{ marginBottom: 'var(--space-2)' }}>
            Invitations Not Available
          </h2>
          <p className="text-secondary">
            RSVP is not enabled for this event. Please contact the host for more
            information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-container">
      <div className="invite-hero">
        {event.venue && (
          <p
            className="text-secondary"
            style={{ marginBottom: 'var(--space-1)' }}
          >
            {event.venue}
          </p>
        )}
        <h1 className="invite-title">{event.name}</h1>
        {event.date && (
          <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>
            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {event.time ? ` at ${event.time}` : ''}
          </p>
        )}
      </div>

      {!selectedGuest ? (
        <div style={{ position: 'relative' }}>
          <label
            className="text-secondary"
            style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontWeight: 500,
            }}
          >
            Find your name to RSVP
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              className="invite-search-input input w-full"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedGuestId(null);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Type your name..."
              autoComplete="off"
            />
            {searching && (
              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <Spinner size={18} />
              </div>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="invite-suggestions">
              {suggestions.map((guest, i) => (
                <div
                  key={guest.id}
                  className={`fys-suggestion ${i === highlightIndex ? 'fys-suggestion--active' : ''}`}
                  onMouseDown={() => selectGuest(guest)}
                  onMouseEnter={() => setHighlightIndex(i)}
                  style={
                    i === highlightIndex
                      ? { background: 'var(--hover-bg, rgba(0,0,0,0.05))' }
                      : undefined
                  }
                >
                  {guest.name}
                </div>
              ))}
            </div>
          )}
          {showSuggestions &&
            query.trim() &&
            !searching &&
            suggestions.length === 0 && (
              <div className="invite-suggestions">
                <div
                  className="fys-suggestion text-muted"
                  style={{ justifyContent: 'center' }}
                >
                  No guests found
                </div>
              </div>
            )}
        </div>
      ) : submitted ? (
        <ConfirmationScreen
          guest={selectedGuest}
          onReset={resetSearch}
          eventSlug={event.slug}
        />
      ) : (
        <RSVPForm
          eventId={event.id}
          guestId={selectedGuest.id}
          guestName={selectedGuest.name}
          onSubmitted={() => setSubmitted(true)}
          onBack={resetSearch}
        />
      )}

      <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
        <Link to={`/e/${event.slug}`} className="btn btn--ghost btn--sm">
          Find Your Seat →
        </Link>
      </div>
    </div>
  );
}

function RSVPForm({
  eventId,
  guestId,
  guestName,
  onSubmitted,
  onBack,
}: {
  eventId: string;
  guestId: string;
  guestName: string;
  onSubmitted: () => void;
  onBack: () => void;
}) {
  const { data: existingRSVP } = useRSVPByGuest(eventId, guestId);
  const upsertRSVP = useUpsertRSVP(eventId);
  const { toast } = useToast();

  const [status, setStatus] = useState<RSVPStatus | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (existingRSVP) {
      setStatus(existingRSVP.status);
      setPlusOnes(existingRSVP.plus_ones ?? 0);
      setMessage(existingRSVP.message ?? '');
    }
  }, [existingRSVP]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      toast('Please select an option', 'error');
      return;
    }
    try {
      await upsertRSVP.mutateAsync({
        guest_id: guestId,
        status,
        plus_ones: status === 'attending' ? plusOnes : 0,
        message: message.trim() || null,
      });
      toast('RSVP submitted!', 'success');
      onSubmitted();
    } catch {
      toast('Failed to submit RSVP', 'error');
    }
  };

  return (
    <div className="invite-rsvp-card">
      <p className="text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
        Hi {guestName}, will you be attending?
      </p>
      <form onSubmit={handleSubmit}>
        <div
          className="invite-rsvp-options"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <label
            className={`invite-rsvp-option ${status === 'attending' ? 'invite-rsvp-option--active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              border:
                status === 'attending'
                  ? '2px solid var(--success, #16a34a)'
                  : '2px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="rsvp"
              checked={status === 'attending'}
              onChange={() => setStatus('attending')}
              style={{ width: 18, height: 18 }}
            />
            <span>🎉 Joyfully Accepts</span>
          </label>
          <label
            className={`invite-rsvp-option ${status === 'not_attending' ? 'invite-rsvp-option--active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              border:
                status === 'not_attending'
                  ? '2px solid var(--error, #dc2626)'
                  : '2px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="rsvp"
              checked={status === 'not_attending'}
              onChange={() => setStatus('not_attending')}
              style={{ width: 18, height: 18 }}
            />
            <span>💔 Regretfully Declines</span>
          </label>
        </div>

        {status === 'attending' && (
          <div
            className="form-field"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <label className="form-field__label">Plus Ones</label>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
              >
                −
              </button>
              <span
                style={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}
              >
                {plusOnes}
              </span>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setPlusOnes((n) => n + 1)}
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="form-field" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-field__label">Message (optional)</label>
          <textarea
            className="input w-full"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a note for the host..."
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div className="flex gap-3" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            Back
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={upsertRSVP.isPending}
          >
            {upsertRSVP.isPending ? <Spinner size={18} /> : 'Submit RSVP'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmationScreen({
  guest,
  onReset,
  eventSlug,
}: {
  guest: GuestWithTable;
  onReset: () => void;
  eventSlug: string;
}) {
  return (
    <div className="invite-rsvp-confirmation" style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--success, #16a34a)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto var(--space-4)',
        }}
      >
        ✓
      </div>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>
        Thank you, {guest.name}!
      </h2>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
        Your RSVP has been recorded. We can't wait to celebrate with you!
      </p>
      {guest.table && (
        <div
          className="fys-table-card"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <div
            className="text-muted"
            style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
          >
            Your Table
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800 }}>
            {guest.table.number}
          </div>
          {guest.table.name && (
            <div className="text-secondary">{guest.table.name}</div>
          )}
        </div>
      )}
      <div className="flex gap-2" style={{ justifyContent: 'center' }}>
        <Link to={`/e/${eventSlug}`} className="btn btn--primary btn--sm">
          Find Your Seat →
        </Link>
        <button className="btn btn--ghost btn--sm" onClick={onReset}>
          Edit RSVP
        </button>
      </div>
    </div>
  );
}
