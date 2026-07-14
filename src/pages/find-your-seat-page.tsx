import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { LoadingScreen, ErrorScreen, Spinner } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useGuestSearch(event?.id ?? '', searchQuery);
  const { data: selectedGuest, isLoading: guestLoading } = useGuestById(
    event?.id ?? '',
    selectedGuestId,
  );

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

  if (isLoading) return <LoadingScreen message="Loading event..." />;
  if (error) return <ErrorScreen message={error.message} />;
  if (!event) return <ErrorScreen message="Event not found" />;

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

  return (
    <div className="fys-container">
      <div className="fys-card">
        <div className="fys-header">
          {event.venue && <p className="fys-venue">{event.venue}</p>}
          <h1 className="fys-title">{event.name}</h1>
          {event.date && (
            <p className="text-secondary">
              {formatDate(event.date)}
              {event.time ? ` at ${event.time}` : ''}
            </p>
          )}
        </div>

        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
          <input
            className="input fys-search w-full"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Type your name to find your seat..."
            autoComplete="off"
          />

          {showSuggestions && searchQuery.trim() && (
            <div className="fys-suggestions">
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
                  {guest.table ? (
                    <span className="badge badge--info">
                      Table {guest.table.number}
                    </span>
                  ) : (
                    <span className="text-muted">Not yet seated</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedGuestId && (
          <div className="fys-result">
            {guestLoading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 'var(--space-6)',
                }}
              >
                <Spinner size={28} />
              </div>
            ) : selectedGuest ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}
              >
                <p
                  className="text-secondary"
                  style={{
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {selectedGuest.name}
                </p>
                {selectedGuest.table ? (
                  <div className="fys-table-card">
                    <span
                      className="text-secondary"
                      style={{ fontSize: '0.875rem' }}
                    >
                      Your Table
                    </span>
                    <span
                      style={{
                        fontSize: '4rem',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {selectedGuest.table.number}
                    </span>
                    {selectedGuest.table.name && (
                      <span className="text-muted">
                        {selectedGuest.table.name}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="card"
                    style={{
                      padding: 'var(--space-6)',
                      textAlign: 'center',
                      width: '100%',
                    }}
                  >
                    <p
                      className="text-secondary"
                      style={{ marginBottom: 'var(--space-1)' }}
                    >
                      You haven't been assigned a seat yet.
                    </p>
                    <p className="text-muted">
                      Please check with the host upon arrival.
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setSelectedGuestId(null)}
                >
                  Search again
                </button>
              </div>
            ) : (
              <p className="text-muted">Guest not found.</p>
            )}
          </div>
        )}

        {event.invitation_enabled && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
            <Link to={`/invite/${event.slug}`} className="btn btn--secondary">
              RSVP / Send Invitation →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
