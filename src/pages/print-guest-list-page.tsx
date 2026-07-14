import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
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

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');

  const isLoading = eventLoading || guestsLoading;

  if (isLoading) {
    return (
      <div className="pgl-page">
        <div className="pgl-loading">
          <div className="pgl-loading-spinner" aria-hidden="true" />
          <p className="pgl-loading-text">Loading guest list…</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pgl-page">
        <div className="pgl-not-found">
          <h1 className="pgl-not-found-title">Event Not Found</h1>
          <p className="pgl-not-found-text">
            We couldn't find the event you're looking for.
          </p>
          <Link to="/" className="pgl-not-found-link">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const sortedGuests = [...(guests ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  const assignedCount = sortedGuests.filter((g) => g.table).length;
  const unassignedCount = sortedGuests.length - assignedCount;

  return (
    <div className="pgl-page">
      <div className="pgl-toolbar">
        <Link to={`/events/${event.id}`} className="pgl-back-link">
          ← Back to Event
        </Link>
        <button
          type="button"
          className="pgl-print-button"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      <div className="pgl-header">
        <h1 className="pgl-event-name">{event.name}</h1>
        <p className="pgl-event-meta">
          {formatDate(event.date)}
          {event.venue ? ` • ${event.venue}` : ''}
        </p>
        <h2 className="pgl-section-title">Guest List</h2>
        <p className="pgl-summary">
          {sortedGuests.length} guest{sortedGuests.length === 1 ? '' : 's'} •{' '}
          {assignedCount} assigned • {unassignedCount} unassigned
        </p>
      </div>

      <table className="pgl-table">
        <thead>
          <tr>
            <th className="pgl-th pgl-th-name">Guest Name</th>
            <th className="pgl-th pgl-th-table">Table</th>
          </tr>
        </thead>
        <tbody>
          {sortedGuests.length === 0 && (
            <tr>
              <td className="pgl-empty" colSpan={2}>
                No guests have been added to this event.
              </td>
            </tr>
          )}
          {sortedGuests.map((guest) => (
            <tr key={guest.id} className="pgl-row">
              <td className="pgl-td pgl-td-name">{guest.name}</td>
              <td className="pgl-td pgl-td-table">
                {guest.table
                  ? `Table ${guest.table.number} — ${guest.table.name}`
                  : 'Unassigned'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
