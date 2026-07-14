import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');

  const isLoading = eventLoading || tablesLoading || guestsLoading;

  if (isLoading) {
    return (
      <div className="psc-page">
        <div className="psc-loading">
          <div className="psc-loading-spinner" aria-hidden="true" />
          <p className="psc-loading-text">Loading seating chart…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="psc-page">
        <div className="psc-not-found">
          <h1 className="psc-not-found-title">Event Not Found</h1>
          <p className="psc-not-found-text">
            We couldn't find the event you're looking for.
          </p>
          <Link to="/" className="psc-not-found-link">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const sortedTables = [...(tables ?? [])].sort(
    (a, b) => a.number - b.number,
  );

  const guestsByTable = (guests ?? []).reduce<
    Record<string, typeof guests>
  >((acc, guest) => {
    if (!guest.table_id) return acc;
    (acc[guest.table_id] ??= []).push(guest);
    return acc;
  }, {});

  const unassignedGuests = (guests ?? []).filter((g) => !g.table_id);

  return (
    <div className="psc-page">
      <div className="psc-toolbar">
        <Link to={`/events/${event.id}`} className="psc-back-link">
          ← Back to Event
        </Link>
        <button
          type="button"
          className="psc-print-button"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      <div className="psc-header">
        <h1 className="psc-event-name">{event.name}</h1>
        <p className="psc-event-meta">
          {formatDate(event.date)}
          {event.venue ? ` • ${event.venue}` : ''}
        </p>
        <h2 className="psc-section-title">Seating Chart</h2>
      </div>

      <div className="psc-tables">
        {sortedTables.length === 0 && (
          <p className="psc-empty">No tables have been created for this event.</p>
        )}

        {sortedTables.map((table) => {
          const tableGuests = guestsByTable[table.id] ?? [];
          return (
            <div key={table.id} className="psc-table">
              <div className="psc-table-header">
                <span className="psc-table-number">Table {table.number}</span>
                <span className="psc-table-name">{table.name}</span>
                <span className="psc-table-count">
                  {tableGuests.length} / {table.capacity}
                </span>
              </div>
              <ul className="psc-guest-list">
                {tableGuests.length === 0 && (
                  <li className="psc-guest-empty">No guests assigned</li>
                )}
                {tableGuests.map((guest) => (
                  <li key={guest.id} className="psc-guest-item">
                    {guest.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {unassignedGuests.length > 0 && (
        <div className="psc-unassigned">
          <h3 className="psc-unassigned-title">Unassigned Guests</h3>
          <ul className="psc-guest-list">
            {unassignedGuests.map((guest) => (
              <li key={guest.id} className="psc-guest-item">
                {guest.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
