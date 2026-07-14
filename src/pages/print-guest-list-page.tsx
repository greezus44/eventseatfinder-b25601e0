import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

export function PrintGuestListPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';
  const { data: event, isLoading } = useEvent(eventId);
  const { data: guests = [] } = useGuests(eventId);

  if (isLoading) {
    return (
      <div className="pgl-page">
        <div className="pgl-loading">
          <p className="pgl-loading-text">Loading guest list...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pgl-page">
        <div className="pgl-error">
          <p className="pgl-error-text">Event not found.</p>
          <Link to="/" className="pgl-back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Sort guests alphabetically by name
  const sortedGuests = [...guests].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="pgl-page">
      {/* Toolbar (hidden when printing) */}
      <div className="pgl-toolbar">
        <Link to={`/events/${eventId}`} className="pgl-back-link">
          ← Back to event
        </Link>
        <button className="pgl-print-btn" onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>

      {/* Printable area */}
      <div className="pgl-print-area">
        <header className="pgl-header">
          <h1 className="pgl-event-name">{event.name}</h1>
          <p className="pgl-event-subtitle">Guest List</p>
        </header>

        {sortedGuests.length === 0 ? (
          <p className="pgl-empty">No guests have been added to this event.</p>
        ) : (
          <>
            <p className="pgl-count">
              Total guests: <strong>{sortedGuests.length}</strong>
            </p>
            <div className="pgl-table-wrapper">
              <table className="pgl-table">
                <thead>
                  <tr>
                    <th className="pgl-th pgl-th-number">#</th>
                    <th className="pgl-th pgl-th-name">Guest</th>
                    <th className="pgl-th pgl-th-table">Table</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGuests.map((guest, index) => (
                    <tr key={guest.id} className="pgl-tr">
                      <td className="pgl-td pgl-td-number">{index + 1}</td>
                      <td className="pgl-td pgl-td-name">{guest.name}</td>
                      <td className="pgl-td pgl-td-table">
                        {guest.table ? guest.table.name : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
