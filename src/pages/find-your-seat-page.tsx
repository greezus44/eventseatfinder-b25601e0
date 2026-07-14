import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEventBySlug } from '@/hooks/use-events';
import { useGuestSearch, useGuestById } from '@/hooks/use-guests';
import type { GuestWithTable } from '@/types/guest';
import { Spinner } from '@/components/ui/feedback';

export function FindYourSeatPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { data: event, isLoading, error } = useEventBySlug(eventSlug ?? '');

  const [query, setQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithTable | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="fys-loading">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="fys-container">
        <div className="fys-card fys-card--error">
          <h1>Event Not Found</h1>
          <p>
            We couldn't find this event. Please check your link and try again.
          </p>
        </div>
      </div>
    );
  }

  if (selectedGuest) {
    return (
      <SeatDisplay
        event={event}
        guest={selectedGuest}
        onBack={() => {
          setSelectedGuest(null);
          setQuery('');
        }}
      />
    );
  }

  return (
    <SearchView
      event={event}
      query={query}
      setQuery={setQuery}
      onSelect={setSelectedGuest}
    />
  );
}

interface EventData {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  slug: string;
}

function SearchView({
  event,
  query,
  setQuery,
  onSelect,
}: {
  event: EventData;
  query: string;
  setQuery: (q: string) => void;
  onSelect: (guest: GuestWithTable) => void;
}) {
  const { data: results, isLoading: searching } = useGuestSearch(
    event.id,
    query,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const guest = results[highlightIndex];
      if (guest) onSelect(guest);
    }
  };

  return (
    <div className="fys-container">
      <div className="fys-header">
        {event.venue && <p className="fys-venue">{event.venue}</p>}
        <h1 className="fys-title">{event.name}</h1>
        {formattedDate && <p className="fys-date">{formattedDate}</p>}
      </div>

      <div className="fys-search">
        <div className="fys-search__input-wrap">
          <span className="fys-search__icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="fys-search__input"
            placeholder="Type your name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {searching && (
            <span className="fys-search__spinner">
              <Spinner size={18} />
            </span>
          )}
        </div>

        {query.trim() && results && results.length > 0 && (
          <ul className="fys-suggestions">
            {results.map((guest, i) => (
              <li
                key={guest.id}
                className={`fys-suggestion ${
                  i === highlightIndex ? 'fys-suggestion--active' : ''
                }`}
                onClick={() => onSelect(guest)}
                onMouseEnter={() => setHighlightIndex(i)}
              >
                <span className="fys-suggestion__name">{guest.name}</span>
                {guest.table ? (
                  <span className="fys-suggestion__table">
                    Table {guest.table.number}
                  </span>
                ) : (
                  <span className="fys-suggestion__table fys-suggestion__table--unassigned">
                    Unassigned
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {query.trim() && results && results.length === 0 && !searching && (
          <div className="fys-no-results">
            <p>No matches found.</p>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Try searching with just your first or last name.
            </p>
          </div>
        )}
      </div>

      <p className="fys-footer">Find your seat in seconds</p>
    </div>
  );
}

function SeatDisplay({
  event,
  guest,
  onBack,
}: {
  event: EventData;
  guest: GuestWithTable;
  onBack: () => void;
}) {
  const { data: freshGuest } = useGuestById(event.id, guest.id);
  const current = freshGuest ?? guest;

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="fys-container">
      <div className="fys-header">
        {event.venue && <p className="fys-venue">{event.venue}</p>}
        <h1 className="fys-title">{event.name}</h1>
        {formattedDate && <p className="fys-date">{formattedDate}</p>}
      </div>

      <div className="fys-result">
        <p className="fys-result__greeting">Welcome</p>
        <h2 className="fys-result__name">{current.name}</h2>

        {current.table ? (
          <div className="fys-table-card">
            <p className="fys-table-card__label">Your Table</p>
            <p className="fys-table-card__number">{current.table.number}</p>
            <p className="fys-table-card__name">{current.table.name}</p>
          </div>
        ) : (
          <div className="fys-table-card fys-table-card--unassigned">
            <p className="fys-table-card__label">Your Table</p>
            <p className="fys-table-card__number">—</p>
            <p className="fys-table-card__name">
              Not yet assigned. Please ask the host.
            </p>
          </div>
        )}
      </div>

      <button className="btn btn--secondary fys-back-btn" onClick={onBack}>
        ← Search again
      </button>
    </div>
  );
}
