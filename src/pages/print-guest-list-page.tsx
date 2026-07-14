import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';

export function PrintGuestListPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event } = useEvent(id);
  const { data: guests } = useGuests(id);
  const { data: tables } = useTables(id);

  if (!event) {
    return (
      <div className="print-page">
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  const tableNameMap = new Map<string, string>();
  (tables ?? []).forEach((t) => {
    tableNameMap.set(t.id, `Table ${t.number} — ${t.name}`);
  });

  const sortedGuests = [...(guests ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="print-page">
      <div className="no-print flex gap-2 mb-4">
        <Link to={`/events/${id}`} className="btn btn-secondary">
          Back to Event
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <h1 className="print-page-title">{event.name}</h1>
      <p className="print-page-subtitle">
        Guest List ({sortedGuests.length} guests)
        {event.date ? ` • ${event.date}` : ''}
        {event.venue ? ` • ${event.venue}` : ''}
      </p>

      {sortedGuests.length === 0 ? (
        <div className="empty-state">No guests yet.</div>
      ) : (
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Name</th>
              <th>Table</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map((guest, i) => (
              <tr key={guest.id}>
                <td>{i + 1}</td>
                <td>{guest.name}</td>
                <td>
                  {guest.table_id
                    ? tableNameMap.get(guest.table_id) ?? '—'
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
