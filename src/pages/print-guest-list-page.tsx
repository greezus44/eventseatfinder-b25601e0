import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { RSVPStatus } from '@/types/rsvp';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading, error } = useEvent(eid);
  const { data: tables } = useTables(eid);
  const { data: guests } = useGuests(eid);
  const { data: rsvps } = useRSVPs(eid);

  const rsvpByGuestId = useMemo(() => {
    const map: Record<string, RSVPStatus> = {};
    rsvps?.forEach((r) => {
      map[r.guest_id] = r.status;
    });
    return map;
  }, [rsvps]);

  const sortedByTable = useMemo(() => {
    const unassigned: GuestWithTable[] = [];
    const byTable: Record<string, GuestWithTable[]> = {};
    guests?.forEach((g) => {
      if (g.table_id) {
        if (!byTable[g.table_id]) byTable[g.table_id] = [];
        byTable[g.table_id].push(g);
      } else {
        unassigned.push(g);
      }
    });
    const sortedTables = (tables ?? [])
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((t) => ({
        table: t,
        guests: (byTable[t.id] ?? [])
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((entry) => entry.guests.length > 0);
    unassigned.sort((a, b) => a.name.localeCompare(b.name));
    return { sortedTables, unassigned };
  }, [guests, tables]);

  const summary = useMemo(() => {
    const total = guests?.length ?? 0;
    const attending =
      rsvps?.filter((r) => r.status === 'attending').length ?? 0;
    const declined =
      rsvps?.filter((r) => r.status === 'not_attending').length ?? 0;
    const pending = total - attending - declined;
    return { total, attending, declined, pending };
  }, [guests, rsvps]);

  if (isLoading) return <LoadingScreen message="Loading guest list..." />;
  if (error) return <ErrorScreen message="Failed to load guest list." />;
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

  const statusBadge = (status: RSVPStatus | undefined) => {
    if (!status)
      return (
        <span style={{ fontSize: '0.75rem', color: '#999' }}>Pending</span>
      );
    const labels: Record<RSVPStatus, string> = {
      attending: '✓ Attending',
      not_attending: '✗ Declined',
      maybe: '? Maybe',
    };
    const colors: Record<RSVPStatus, string> = {
      attending: '#16a34a',
      not_attending: '#dc2626',
      maybe: '#f59e0b',
    };
    return (
      <span
        style={{ fontSize: '0.75rem', color: colors[status], fontWeight: 500 }}
      >
        {labels[status]}
      </span>
    );
  };

  let rowNumber = 0;

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
          to={`/events/${eid}/print`}
          className="btn btn--secondary btn--sm"
        >
          Seating Chart
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

        <div
          className="print-summary"
          style={{
            display: 'flex',
            gap: 'var(--space-4)',
            justifyContent: 'center',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {summary.total}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}
            >
              {summary.attending}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Attending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}
            >
              {summary.declined}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Declined</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {summary.pending}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Pending</div>
          </div>
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
          Guest List
        </h2>

        <div className="print-guest-list">
          {sortedByTable.sortedTables.length === 0 &&
          sortedByTable.unassigned.length === 0 ? (
            <p
              className="print-empty"
              style={{
                textAlign: 'center',
                color: '#999',
                padding: 'var(--space-6)',
              }}
            >
              No guests yet.
            </p>
          ) : (
            <>
              {sortedByTable.sortedTables.map(
                ({ table, guests: tableGuests }) => (
                  <div
                    key={table.id}
                    className="print-table"
                    style={{ marginBottom: 'var(--space-5)' }}
                  >
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      {table.name} (#{table.number}) — {tableGuests.length}{' '}
                      guest{tableGuests.length !== 1 ? 's' : ''}
                    </h3>
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse' }}
                    >
                      <tbody>
                        {tableGuests.map((g) => {
                          rowNumber++;
                          return (
                            <tr
                              key={g.id}
                              style={{ borderBottom: '1px solid #eee' }}
                            >
                              <td
                                style={{
                                  padding: '4px 8px',
                                  width: 40,
                                  color: '#999',
                                  fontSize: '0.875rem',
                                }}
                              >
                                {rowNumber}
                              </td>
                              <td style={{ padding: '4px 8px' }}>{g.name}</td>
                              <td
                                style={{
                                  padding: '4px 8px',
                                  textAlign: 'right',
                                }}
                              >
                                <span className="print-rsvp-badge">
                                  {statusBadge(rsvpByGuestId[g.id])}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ),
              )}

              {sortedByTable.unassigned.length > 0 && (
                <div
                  className="print-unassigned"
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Unassigned ({sortedByTable.unassigned.length})
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {sortedByTable.unassigned.map((g) => {
                        rowNumber++;
                        return (
                          <tr
                            key={g.id}
                            style={{ borderBottom: '1px solid #eee' }}
                          >
                            <td
                              style={{
                                padding: '4px 8px',
                                width: 40,
                                color: '#999',
                                fontSize: '0.875rem',
                              }}
                            >
                              {rowNumber}
                            </td>
                            <td style={{ padding: '4px 8px' }}>{g.name}</td>
                            <td
                              style={{ padding: '4px 8px', textAlign: 'right' }}
                            >
                              <span className="print-rsvp-badge">
                                {statusBadge(rsvpByGuestId[g.id])}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

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
