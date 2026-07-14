import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event } = useEvent(id);
  const { data: tables } = useTables(id);
  const { data: guests } = useGuests(id);

  if (!event) {
    return (
      <div className="print-page">
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  const guestsByTable = new Map<string, typeof guests>();
  (guests ?? []).forEach((g) => {
    if (!g.table_id) return;
    const arr = guestsByTable.get(g.table_id) ?? [];
    arr.push(g);
    guestsByTable.set(g.table_id, arr);
  });

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
        Seating Chart
        {event.date ? ` • ${event.date}` : ''}
        {event.venue ? ` • ${event.venue}` : ''}
      </p>

      {(tables ?? []).length === 0 ? (
        <div className="empty-state">No tables assigned yet.</div>
      ) : (
        (tables ?? []).map((table) => {
          const tableGuests = guestsByTable.get(table.id) ?? [];
          return (
            <div key={table.id} className="print-section">
              <h2 className="print-section-title">
                Table {table.number} — {table.name} ({tableGuests.length}/
                {table.capacity})
              </h2>
              {tableGuests.length === 0 ? (
                <p className="empty-state" style={{ padding: '12px 0' }}>
                  No guests assigned
                </p>
              ) : (
                tableGuests.map((g) => (
                  <div key={g.id} className="print-guest-row">
                    {g.name}
                  </div>
                ))
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
