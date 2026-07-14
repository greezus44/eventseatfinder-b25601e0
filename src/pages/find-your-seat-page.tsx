import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { Spinner, LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

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
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  if (isLoading) return <LoadingScreen message="Loading event..." />;
  if (error) return <ErrorScreen message="Failed to load event." />;
  if (!event) return <ErrorScreen message="Event not found." />;

  return (
    <div className="fys-container">
      <div className="fys-card">
        <div className="fys-header">
          <h1 className="fys-title">{event.name}</h1>
          {event.venue && <p className="fys-venue">{event.venue}</p>}
          {event.date && (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
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
              Find your seat
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                className="fys-search input w-full"
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
              <div className="fys-suggestions">
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
                    <span>{guest.name}</span>
                    {guest.table ? (
                      <span
                        className="text-muted"
                        style={{ fontSize: '0.875rem' }}
                      >
                        Table {guest.table.number}
                      </span>
                    ) : (
                      <span
                        className="text-muted"
                        style={{ fontSize: '0.875rem' }}
                      >
                        Not yet assigned
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showSuggestions &&
              query.trim() &&
              !searching &&
              suggestions.length === 0 && (
                <div className="fys-suggestions">
                  <div
                    className="fys-suggestion text-muted"
                    style={{ justifyContent: 'center' }}
                  >
                    No guests found
                  </div>
                </div>
              )}
          </div>
        ) : (
          <SeatDisplay guest={selectedGuest} onReset={resetSearch} />
        )}

        {event.invitation_enabled && (
          <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
            <Link
              to={`/invite/${event.slug}`}
              className="btn btn--ghost btn--sm"
            >
              RSVP →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SeatDisplay({
  guest,
  onReset,
}: {
  guest: GuestWithTable;
  onReset: () => void;
}) {
  return (
    <div className="fys-result">
      <p
        className="text-secondary"
        style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}
      >
        Welcome, {guest.name}!
      </p>
      {guest.table ? (
        <div className="fys-table-card">
          <div
            className="text-muted"
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Your Table
          </div>
          <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>
            {guest.table.number}
          </div>
          {guest.table.name && (
            <div
              className="text-secondary"
              style={{ marginTop: 'var(--space-1)' }}
            >
              {guest.table.name}
            </div>
          )}
        </div>
      ) : (
        <div className="fys-table-card">
          <div
            className="text-muted"
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Your Table
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginTop: 'var(--space-2)',
            }}
          >
            Not yet assigned
          </div>
          <p
            className="text-muted"
            style={{ marginTop: 'var(--space-1)', fontSize: '0.875rem' }}
          >
            Please check with the host upon arrival.
          </p>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
        <button className="btn btn--secondary btn--sm" onClick={onReset}>
          Search again
        </button>
      </div>
    </div>
  );
}
