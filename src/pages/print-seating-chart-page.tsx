import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');

  const isLoading = eventLoading || tablesLoading || guestsLoading;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="psc-page">
        <div className="psc-loading">Loading seating chart...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="psc-page">
        <div className="psc-not-found">
          <h1 className="psc-not-found-title">Event Not Found</h1>
          <Link className="psc-link" to="/">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const tableList = tables ?? [];
  const allGuests = guests ?? [];

  // Group guests by table
  const guestsByTable = tableList.map((table) => ({
    table,
    guests: allGuests.filter((g) => g.table_id === table.id),
  }));

  const unseatedGuests = allGuests.filter(
    (g) => !g.table_id || !tableList.some((t) => t.id === g.table_id),
  );

  return (
    <div className="psc-page">
      <div className="psc-toolbar">
        <Link className="psc-back-link" to={`/events/${event.id}`}>
          ← Back to Event
        </Link>
        <button className="psc-print-btn" onClick={handlePrint}>
          Print Seating Chart
        </button>
      </div>

      <div className="psc-document">
        <header className="psc-header">
          <h1 className="psc-event-name">{event.name}</h1>
          {event.date && (
            <p className="psc-event-date">
              {new Date(event.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {event.time ? ` at ${event.time}` : ''}
            </p>
          )}
          {event.venue && <p className="psc-event-venue">{event.venue}</p>}
        </header>

        <h2 className="psc-section-title">Seating Chart</h2>

        <div className="psc-tables-grid">
          {guestsByTable.map(({ table, guests: tableGuests }) => (
            <div className="psc-table-card" key={table.id}>
              <div className="psc-table-header">
                <h3 className="psc-table-name">
                  {table.name || `Table ${table.number ?? ''}`}
                </h3>
                {table.number != null && (
                  <span className="psc-table-number">#{table.number}</span>
                )}
              </div>
              <ul className="psc-guest-list">
                {tableGuests.length === 0 ? (
                  <li className="psc-guest-empty">No guests assigned</li>
                ) : (
                  tableGuests.map((guest) => (
                    <li className="psc-guest-item" key={guest.id}>
                      {guest.name}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>

        {unseatedGuests.length > 0 && (
          <div className="psc-unseated">
            <h3 className="psc-unseated-title">Unseated Guests</h3>
            <ul className="psc-guest-list">
              {unseatedGuests.map((guest) => (
                <li className="psc-guest-item" key={guest.id}>
                  {guest.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
