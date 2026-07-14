import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useEvent(eventId ?? '');
  const { data: tables = [] } = useTables(eventId ?? '');
  const { data: guests = [] } = useGuests(eventId ?? '');

  if (isLoading) {
    return (
      <div className="psc-page">
        <div className="psc-loading">
          <div className="psc-loading__spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="psc-page">
        <div className="psc-not-found">
          <h1 className="psc-not-found__title">Event not found</h1>
          <Link to="/" className="psc-not-found__link">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const eventDate = event.date
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  return (
    <div className="psc-page">
      <div className="psc-toolbar">
        <div className="psc-toolbar__left">
          <Link to={`/events/${event.id}`} className="psc-toolbar__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to event
          </Link>
        </div>
        <div className="psc-toolbar__right">
          <button className="psc-toolbar__print" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="psc-document">
        <header className="psc-header">
          <h1 className="psc-header__title">{event.name}</h1>
          <p className="psc-header__subtitle">Seating Chart</p>
          {(eventDate || event.venue) && (
            <div className="psc-header__meta">
              {eventDate && <span>{eventDate}</span>}
              {event.venue && <span>{event.venue}</span>}
            </div>
          )}
        </header>

        <div className="psc-tables">
          {tables.length === 0 && (
            <p className="psc-empty">No tables have been created yet.</p>
          )}
          {tables.map((table) => {
            const tableGuests = guests.filter((g) => g.table_id === table.id);
            return (
              <div key={table.id} className="psc-table">
                <div className="psc-table__header">
                  <span className="psc-table__number">Table {table.number}</span>
                  <span className="psc-table__name">{table.name}</span>
                  <span className="psc-table__count">
                    {tableGuests.length} / {table.capacity}
                  </span>
                </div>
                <div className="psc-table__guests">
                  {tableGuests.length === 0 ? (
                    <span className="psc-table__empty">No guests assigned</span>
                  ) : (
                    <ul className="psc-guest-list">
                      {tableGuests.map((g) => (
                        <li key={g.id} className="psc-guest-list__item">{g.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="psc-summary">
          <div className="psc-summary__item">
            <span className="psc-summary__label">Tables</span>
            <span className="psc-summary__value">{tables.length}</span>
          </div>
          <div className="psc-summary__item">
            <span className="psc-summary__label">Guests</span>
            <span className="psc-summary__value">{guests.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
