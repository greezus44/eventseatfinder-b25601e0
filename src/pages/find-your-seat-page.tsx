import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import { Spinner, ErrorScreen, LoadingScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isFetching } = useGuestSearch(
    event?.id ?? '',
    search,
  );

  const { data: selectedGuest } = useGuestById(
    event?.id ?? '',
    selectedGuestId,
  );

  useEffect(() => {
    if (event) {
      searchRef.current?.focus();
    }
  }, [event]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [search]);

  if (isLoading) return <LoadingScreen message="Loading event..." />;
  if (error) return <ErrorScreen message="Failed to load event" />;
  if (!event) return <ErrorScreen message="Event not found" />;

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

  const resetSearch = () => {
    setSelectedGuestId(null);
    setSearch('');
    searchRef.current?.focus();
  };

  return (
    <div className="fys-container">
      <div className="fys-card">
        <div className="fys-header">
          <div className="fys-venue">{event.venue ?? 'Venue TBA'}</div>
          <h1 className="fys-title">{event.name}</h1>
          <div className="fys-date">
            {event.date
              ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Date TBA'}
            {event.time ? ` at ${event.time}` : ''}
          </div>
        </div>

        {!selectedGuest ? (
          <div className="fys-search">
            <label
              htmlFor="fys-input"
              className="text-secondary"
              style={{ display: 'block', marginBottom: 'var(--space-2)' }}
            >
              Find your seat — type your name
            </label>
            <input
              ref={searchRef}
              id="fys-input"
              type="text"
              className="fys-search__input"
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
            />

            {showSuggestions && search.trim() && (
              <div className="fys-suggestions" ref={suggestionsRef}>
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
                      <span>{guest.name}</span>
                      {guest.table ? (
                        <span className="text-muted">
                          Table {guest.table.number}
                        </span>
                      ) : (
                        <span className="text-muted">Not yet assigned</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="fys-result">
            {selectedGuest ? (
              <div className="fys-table-card">
                <div
                  className="text-secondary"
                  style={{ marginBottom: 'var(--space-2)' }}
                >
                  {selectedGuest.name}
                </div>
                {selectedGuest.table ? (
                  <>
                    <div className="fys-table-card__number">
                      {selectedGuest.table.number}
                    </div>
                    <div className="fys-table-card__label">Your Table</div>
                    {selectedGuest.table.name && (
                      <div
                        className="text-muted"
                        style={{ marginTop: 'var(--space-2)' }}
                      >
                        {selectedGuest.table.name}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="fys-table-card__number">—</div>
                    <div className="fys-table-card__label">
                      Not Yet Assigned
                    </div>
                    <div
                      className="text-muted"
                      style={{ marginTop: 'var(--space-2)' }}
                    >
                      Please check with the host upon arrival
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Spinner size={28} />
            )}

            <div
              className="flex gap-3"
              style={{ marginTop: 'var(--space-5)', justifyContent: 'center' }}
            >
              <button
                type="button"
                className="btn btn--secondary"
                onClick={resetSearch}
              >
                Search Again
              </button>
              {event.invitation_enabled && (
                <Link to={`/invite/${event.slug}`} className="btn btn--primary">
                  RSVP
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
