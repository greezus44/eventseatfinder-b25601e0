import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');

  const isLoading = eventLoading || guestsLoading;

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="pgl-page">
        <div className="pgl-loading">Loading guest list...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pgl-page">
        <div className="pgl-not-found">
          <h1 className="pgl-not-found-title">Event Not Found</h1>
          <Link className="pgl-link" to="/">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const allGuests = guests ?? [];

  return (
    <div className="pgl-page">
      <div className="pgl-toolbar">
        <Link className="pgl-back-link" to={`/events/${event.id}`}>
          ← Back to Event
        </Link>
        <button className="pgl-print-btn" onClick={handlePrint}>
          Print Guest List
        </button>
      </div>

      <div className="pgl-document">
        <header className="pgl-header">
          <h1 className="pgl-event-name">{event.name}</h1>
          {event.date && (
            <p className="pgl-event-date">
              {new Date(event.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {event.time ? ` at ${event.time}` : ''}
            </p>
          )}
          {event.venue && <p className="pgl-event-venue">{event.venue}</p>}
        </header>

        <h2 className="pgl-section-title">
          Guest List ({allGuests.length} {allGuests.length === 1 ? 'guest' : 'guests'})
        </h2>

        {allGuests.length === 0 ? (
          <p className="pgl-empty">No guests have been added yet.</p>
        ) : (
          <table className="pgl-table">
            <thead>
              <tr>
                <th className="pgl-th pgl-th--num">#</th>
                <th className="pgl-th">Guest Name</th>
                <th className="pgl-th">Table</th>
              </tr>
            </thead>
            <tbody>
              {allGuests.map((guest, idx) => {
                const table = guest.table;
                const tableLabel = table
                  ? table.name || `Table ${table.number ?? ''}`
                  : 'Unassigned';
                return (
                  <tr className="pgl-row" key={guest.id}>
                    <td className="pgl-td pgl-td--num">{idx + 1}</td>
                    <td className="pgl-td pgl-td--name">{guest.name}</td>
                    <td className="pgl-td pgl-td--table">
                      {table ? tableLabel : <span className="pgl-unassigned">Unassigned</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
