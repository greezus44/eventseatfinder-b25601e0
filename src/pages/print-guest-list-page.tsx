import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useEvent(eventId ?? '');
  const { data: guests = [] } = useGuests(eventId ?? '');

  if (isLoading) {
    return (
      <div className="pgl-page">
        <div className="pgl-loading">
          <div className="pgl-loading__spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pgl-page">
        <div className="pgl-not-found">
          <h1 className="pgl-not-found__title">Event not found</h1>
          <Link to="/" className="pgl-not-found__link">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const eventDate = event.date
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const seatedCount = guests.filter((g) => g.table).length;
  const unseatedCount = guests.length - seatedCount;

  return (
    <div className="pgl-page">
      <div className="pgl-toolbar">
        <div className="pgl-toolbar__left">
          <Link to={`/events/${event.id}`} className="pgl-toolbar__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to event
          </Link>
        </div>
        <div className="pgl-toolbar__right">
          <button className="pgl-toolbar__print" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="pgl-document">
        <header className="pgl-header">
          <h1 className="pgl-header__title">{event.name}</h1>
          <p className="pgl-header__subtitle">Guest List</p>
          {(eventDate || event.venue) && (
            <div className="pgl-header__meta">
              {eventDate && <span>{eventDate}</span>}
              {event.venue && <span>{event.venue}</span>}
            </div>
          )}
        </header>

        <div className="pgl-summary">
          <div className="pgl-summary__item">
            <span className="pgl-summary__label">Total guests</span>
            <span className="pgl-summary__value">{guests.length}</span>
          </div>
          <div className="pgl-summary__item">
            <span className="pgl-summary__label">Seated</span>
            <span className="pgl-summary__value">{seatedCount}</span>
          </div>
          <div className="pgl-summary__item">
            <span className="pgl-summary__label">Unseated</span>
            <span className="pgl-summary__value">{unseatedCount}</span>
          </div>
        </div>

        {guests.length === 0 ? (
          <p className="pgl-empty">No guests have been added yet.</p>
        ) : (
          <table className="pgl-table">
            <thead>
              <tr>
                <th className="pgl-table__th pgl-table__th--num">#</th>
                <th className="pgl-table__th">Guest Name</th>
                <th className="pgl-table__th">Table</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g, i) => (
                <tr key={g.id} className="pgl-table__row">
                  <td className="pgl-table__td pgl-table__td--num">{i + 1}</td>
                  <td className="pgl-table__td pgl-table__td--name">{g.name}</td>
                  <td className="pgl-table__td">
                    {g.table ? (
                      <span className="pgl-table__assignment">
                        <span className="pgl-table__assignment-name">{g.table.name}</span>
                        <span className="pgl-table__assignment-num">#{g.table.number}</span>
                      </span>
                    ) : (
                      <span className="pgl-table__unseated">Unseated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
