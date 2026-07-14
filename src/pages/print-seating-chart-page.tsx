import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatGeneratedDate(): string {
  return new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const { data: tables } = useTables(id);
  const { data: guests } = useGuests(id);

  if (isLoading) return <LoadingScreen label="Loading seating chart…" />;

  if (!event) {
    return (
      <div className="print-page">
        <ErrorScreen message="Event not found" />
        <Link to="/" className="btn btn--secondary btn--sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const tableList = tables ?? [];
  const guestList = guests ?? [];

  const guestsByTable = new Map<string, GuestWithTable[]>();
  const unassignedGuests: GuestWithTable[] = [];
  for (const g of guestList) {
    if (g.table_id) {
      const arr = guestsByTable.get(g.table_id) ?? [];
      arr.push(g);
      guestsByTable.set(g.table_id, arr);
    } else {
      unassignedGuests.push(g);
    }
  }

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <Link to={`/events/${id}/overview`} className="btn btn--secondary">
          ← Back
        </Link>
        <button className="btn btn--primary" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="print-document">
        <div className="print-header">
          <h1 className="print-title">{event.name}</h1>
          {event.venue && <div className="print-venue">{event.venue}</div>}
          <div className="print-date">{formatDate(event.date)}</div>
        </div>

        <h2 className="print-section-title">Seating Chart</h2>

        {tableList.length === 0 ? (
          <p className="text-secondary">No tables assigned yet.</p>
        ) : (
          <div className="print-tables-grid">
            {tableList.map((table) => {
              const tableGuests = guestsByTable.get(table.id) ?? [];
              return (
                <div key={table.id} className="print-table-card">
                  <div className="print-table-card__header">
                    <span className="print-table-card__name">{table.name}</span>
                    <span className="print-table-card__number">
                      #{table.number}
                    </span>
                  </div>
                  <div className="print-table-card__count">
                    {tableGuests.length} / {table.capacity} guests
                  </div>
                  <div className="print-table-card__guests">
                    {tableGuests.length === 0 ? (
                      <span className="print-guest-name--empty">
                        No guests assigned
                      </span>
                    ) : (
                      tableGuests.map((g) => (
                        <div key={g.id} className="print-guest-name">
                          {g.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {unassignedGuests.length > 0 && (
          <div className="print-unassigned">
            <h2 className="print-section-title">Unassigned Guests</h2>
            <div className="print-unassigned-list">
              {unassignedGuests.map((g) => (
                <div key={g.id} className="print-guest-name">
                  {g.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="print-footer">Generated {formatGeneratedDate()}</div>
      </div>
    </div>
  );
}
