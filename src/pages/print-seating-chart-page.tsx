import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading, error } = useEvent(eid);
  const { data: tables } = useTables(eid);
  const { data: guests } = useGuests(eid);

  const guestsByTable = useMemo(() => {
    const map: Record<string, GuestWithTable[]> = {};
    guests?.forEach((g) => {
      if (g.table_id) {
        if (!map[g.table_id]) map[g.table_id] = [];
        map[g.table_id].push(g);
      }
    });
    return map;
  }, [guests]);

  const unassignedGuests = useMemo(
    () => guests?.filter((g) => !g.table_id) ?? [],
    [guests],
  );

  if (isLoading) return <LoadingScreen message="Loading seating chart..." />;
  if (error) return <ErrorScreen message="Failed to load seating chart." />;
  if (!event) return <ErrorScreen message="Event not found." />;

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="print-page">
      <div
        className="print-toolbar"
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          padding: 'var(--space-3)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          className="btn btn--primary btn--sm"
          onClick={() => window.print()}
        >
          🖨 Print
        </button>
        <Link
          to={`/events/${eid}/print/guests`}
          className="btn btn--secondary btn--sm"
        >
          Guest List
        </Link>
        <Link
          to={`/events/${eid}/seating`}
          className="btn btn--secondary btn--sm"
        >
          ← Back to Seating
        </Link>
      </div>

      <div className="print-document" style={{ padding: 'var(--space-6)' }}>
        <div
          className="print-header"
          style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}
        >
          <h1
            className="print-title"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: 'var(--space-1)',
            }}
          >
            {event.name}
          </h1>
          {event.venue && (
            <p
              className="print-venue"
              style={{ fontSize: '1.1rem', color: '#555' }}
            >
              {event.venue}
            </p>
          )}
          {formatDate(event.date) && (
            <p className="print-date" style={{ color: '#666' }}>
              {formatDate(event.date)}
              {event.time ? ` at ${event.time}` : ''}
            </p>
          )}
        </div>

        <h2
          className="print-section-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
            borderBottom: '2px solid #ddd',
            paddingBottom: 'var(--space-2)',
          }}
        >
          Seating Chart
        </h2>

        {tables && tables.length === 0 ? (
          <p
            className="print-empty"
            style={{
              textAlign: 'center',
              color: '#999',
              padding: 'var(--space-6)',
            }}
          >
            No tables have been created yet.
          </p>
        ) : (
          <div
            className="print-tables-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {tables?.map((table: Table) => {
              const tableGuests = guestsByTable[table.id] ?? [];
              return (
                <div
                  key={table.id}
                  className="print-table-card"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 'var(--space-3)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>
                      {table.name}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      #{table.number}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {tableGuests.length} guest
                    {tableGuests.length !== 1 ? 's' : ''} · Cap {table.capacity}
                  </div>
                  <div>
                    {tableGuests.length === 0 ? (
                      <span
                        className="print-empty"
                        style={{ fontSize: '0.875rem', color: '#999' }}
                      >
                        No guests assigned
                      </span>
                    ) : (
                      tableGuests.map((g) => (
                        <div
                          key={g.id}
                          className="print-guest-name"
                          style={{ padding: '2px 0', fontSize: '0.9rem' }}
                        >
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
          <div
            className="print-unassigned"
            style={{ marginTop: 'var(--space-6)' }}
          >
            <h2
              className="print-section-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
                borderBottom: '2px solid #ddd',
                paddingBottom: 'var(--space-2)',
              }}
            >
              Unassigned Guests ({unassignedGuests.length})
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 'var(--space-2)',
              }}
            >
              {unassignedGuests.map((g) => (
                <div
                  key={g.id}
                  className="print-guest-name"
                  style={{ padding: '2px 0', fontSize: '0.9rem' }}
                >
                  {g.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="print-footer"
          style={{
            marginTop: 'var(--space-6)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#999',
          }}
        >
          Generated by Seatly · {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
