import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';
  const { data: event, isLoading } = useEvent(eventId);
  const { data: tables = [] } = useTables(eventId);
  const { data: guests = [] } = useGuests(eventId);

  if (isLoading) {
    return (
      <div className="psc-page">
        <div className="psc-loading">
          <p className="psc-loading-text">Loading seating chart...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="psc-page">
        <div className="psc-error">
          <p className="psc-error-text">Event not found.</p>
          <Link to="/" className="psc-back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Group guests by table_id
  const guestsByTable = guests.reduce((acc, guest) => {
    const key = guest.table_id ?? 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(guest);
    return acc;
  }, {} as Record<string, typeof guests>);

  const unassignedGuests = guestsByTable['unassigned'] ?? [];

  return (
    <div className="psc-page">
      {/* Toolbar (hidden when printing) */}
      <div className="psc-toolbar">
        <Link to={`/events/${eventId}`} className="psc-back-link">
          ← Back to event
        </Link>
        <button className="psc-print-btn" onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>

      {/* Printable area */}
      <div className="psc-print-area">
        <header className="psc-header">
          <h1 className="psc-event-name">{event.name}</h1>
          <p className="psc-event-subtitle">Seating Chart</p>
        </header>

        {tables.length === 0 ? (
          <p className="psc-empty">No tables have been created for this event.</p>
        ) : (
          <div className="psc-tables">
            {tables.map((table) => {
              const tableGuests = guestsByTable[table.id] ?? [];
              return (
                <div key={table.id} className="psc-table-card">
                  <div className="psc-table-header">
                    <span className="psc-table-name">{table.name}</span>
                    <span className="psc-table-meta">
                      Table {table.number} · {tableGuests.length}/{table.capacity} seats
                    </span>
                  </div>
                  {tableGuests.length === 0 ? (
                    <p className="psc-table-empty">No guests assigned</p>
                  ) : (
                    <ul className="psc-guest-list">
                      {tableGuests.map((guest) => (
                        <li key={guest.id} className="psc-guest-item">
                          {guest.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {unassignedGuests.length > 0 && (
          <div className="psc-unassigned">
            <h2 className="psc-unassigned-title">Unassigned Guests</h2>
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
    </div>
  );
}
