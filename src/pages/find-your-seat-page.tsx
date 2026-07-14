import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { ErrorScreen, LoadingScreen, Spinner } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const search = useGuestSearch(event?.id ?? '', query);
  const { data: selectedGuest, isLoading: guestLoading } = useGuestById(
    event?.id ?? '',
    selectedGuestId,
  );

  const suggestions = search.data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    if (event) inputRef.current?.focus();
  }, [event]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
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

  const selectGuest = useCallback((guest: GuestWithTable) => {
    setSelectedGuestId(guest.id);
    setQuery(guest.name);
    setShowSuggestions(false);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const guest = suggestions[highlightIndex];
      if (guest) selectGuest(guest);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Loading event…" />;
  if (error)
    return <ErrorScreen message={error.message || 'Failed to load event'} />;
  if (!event) return <ErrorScreen message="Event not found" />;

  const accent = event.accent_color ?? '#4f46e5';

  return (
    <div className="find-seat-page" style={{ ['--accent' as string]: accent }}>
      <div className="find-seat__container">
        <header className="find-seat__header">
          <h1 className="find-seat__title">{event.name}</h1>
          {(event.date || event.venue) && (
            <p className="find-seat__meta text-secondary">
              {event.date && <span>{formatDate(event.date)}</span>}
              {event.date && event.venue && <span> · </span>}
              {event.venue && <span>{event.venue}</span>}
            </p>
          )}
        </header>

        <div className="find-seat__search" ref={containerRef}>
          <label className="find-seat__search-label">Find your seat</label>
          <div className="search-input-wrap">
            <span className="search-input-wrap__icon">🔍</span>
            <input
              ref={inputRef}
              className="input search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedGuestId(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Type your name…"
              autoComplete="off"
            />
            {search.isFetching && (
              <span className="search-input-wrap__spinner">
                <Spinner size={18} />
              </span>
            )}
          </div>

          {showSuggestions && query.trim() && (
            <div className="suggestions">
              {suggestions.length === 0 && !search.isFetching ? (
                <div className="suggestions__empty">
                  No guests found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                suggestions.map((guest, i) => (
                  <button
                    key={guest.id}
                    className={`suggestion ${
                      i === highlightIndex ? 'suggestion--active' : ''
                    }`}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onClick={() => selectGuest(guest)}
                  >
                    <span className="suggestion__name">{guest.name}</span>
                    {guest.table ? (
                      <span className="suggestion__table">
                        Table {guest.table.number}
                      </span>
                    ) : (
                      <span className="suggestion__table text-muted">
                        Unassigned
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedGuestId && (
          <SeatDisplay guest={selectedGuest} loading={guestLoading} />
        )}
      </div>
    </div>
  );
}

function SeatDisplay({
  guest,
  loading,
}: {
  guest: GuestWithTable | null | undefined;
  loading: boolean;
}) {
  if (loading || !guest) {
    return (
      <div className="card seat-card seat-card--loading">
        <Spinner size={28} />
      </div>
    );
  }

  const assigned = !!guest.table;

  return (
    <div
      className={`card seat-card ${assigned ? '' : 'seat-card--unassigned'}`}
    >
      <p className="seat-card__greeting">
        Welcome, <strong>{guest.name}</strong>
      </p>
      {assigned ? (
        <>
          <p className="seat-card__label text-secondary">You are seated at</p>
          <div className="seat-card__table-number">{guest.table!.number}</div>
          <p className="seat-card__table-name">{guest.table!.name}</p>
        </>
      ) : (
        <>
          <p className="seat-card__label text-secondary">
            Your seat hasn&apos;t been assigned yet
          </p>
          <div className="seat-card__table-number seat-card__table-number--none">
            —
          </div>
          <p className="seat-card__table-name text-muted">
            Please check with the host
          </p>
        </>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
