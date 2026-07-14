import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useRSVPs } from '@/hooks/use-rsvps';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');
  const { data: rsvps, isLoading: rsvpsLoading } = useRSVPs(eventId ?? '');

  const rsvpMap = useMemo(() => {
    const map = new Map<
      string,
      { status: string; plus_ones: number; message: string | null }
    >();
    for (const r of rsvps ?? []) {
      map.set(r.guest_id, {
        status: r.status,
        plus_ones: r.plus_ones,
        message: r.message,
      });
    }
    return map;
  }, [rsvps]);

  const groupedGuests = useMemo(() => {
    const byTable = new Map<string, { name: string; rsvp: string | null }[]>();
    const unassigned: { name: string; rsvp: string | null }[] = [];

    for (const g of guests ?? []) {
      const rsvp = rsvpMap.get(g.id)?.status ?? null;
      if (g.table_id) {
        const arr = byTable.get(g.table_id) ?? [];
        arr.push({ name: g.name, rsvp });
        byTable.set(g.table_id, arr);
      } else {
        unassigned.push({ name: g.name, rsvp });
      }
    }

    return { byTable, unassigned };
  }, [guests, rsvpMap]);

  if (eventLoading || tablesLoading || guestsLoading || rsvpsLoading)
    return <LoadingScreen message="Loading guest list…" />;
  if (!event) return <ErrorScreen message="Event not found." />;

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const formattedTime = event.time
    ? new Date(`2000-01-01T${event.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const totalGuests = guests?.length ?? 0;
  const attending = (rsvps ?? []).filter(
    (r) => r.status === 'attending',
  ).length;
  const declined = (rsvps ?? []).filter(
    (r) => r.status === 'not_attending',
  ).length;
  const pending = totalGuests - (rsvps?.length ?? 0);

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <Link
          to={`/events/${eventId}/print`}
          className="btn btn--secondary btn--sm"
        >
          ← Seating Chart
        </Link>
        <div className="flex gap-3">
          <Link
            to={`/events/${eventId}/overview`}
            className="btn btn--secondary btn--sm"
          >
            Overview
          </Link>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="print-document">
        <div className="print-header">
          <h1 className="print-title">{event.name}</h1>
          {event.venue && <p className="print-venue">{event.venue}</p>}
          <p className="print-date">
            {formattedDate}
            {formattedTime && ` · ${formattedTime}`}
          </p>
        </div>

        <div className="print-summary">
          <div className="print-summary__item">
            <span className="print-summary__value">{totalGuests}</span>
            <span className="print-summary__label">Total Guests</span>
          </div>
          <div className="print-summary__item print-summary__item--success">
            <span className="print-summary__value">{attending}</span>
            <span className="print-summary__label">Attending</span>
          </div>
          <div className="print-summary__item print-summary__item--error">
            <span className="print-summary__value">{declined}</span>
            <span className="print-summary__label">Declined</span>
          </div>
          <div className="print-summary__item print-summary__item--warning">
            <span className="print-summary__value">{pending}</span>
            <span className="print-summary__label">Pending</span>
          </div>
        </div>

        <h2 className="print-section-title">Guest List by Table</h2>

        {tables && tables.length > 0 ? (
          <div className="print-guest-list">
            {tables.map((table) => {
              const tableGuests = groupedGuests.byTable.get(table.id) ?? [];
              return (
                <div key={table.id} className="print-guest-list__section">
                  <div className="print-guest-list__table-header">
                    <span className="print-guest-list__table-name">
                      {table.name} (Table {table.number})
                    </span>
                    <span className="print-guest-list__table-count">
                      {tableGuests.length} / {table.capacity}
                    </span>
                  </div>
                  {tableGuests.length > 0 ? (
                    <table className="print-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Guest Name</th>
                          <th>RSVP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableGuests.map((g, i) => (
                          <tr key={i}>
                            <td className="print-table__num">{i + 1}</td>
                            <td>{g.name}</td>
                            <td>
                              <span
                                className={`print-rsvp-badge print-rsvp-badge--${g.rsvp ?? 'pending'}`}
                              >
                                {g.rsvp === 'attending'
                                  ? 'Attending'
                                  : g.rsvp === 'not_attending'
                                    ? 'Declined'
                                    : g.rsvp === 'maybe'
                                      ? 'Maybe'
                                      : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="print-guest-name print-guest-name--empty">
                      No guests assigned
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="print-empty">No tables have been created yet.</p>
        )}

        {groupedGuests.unassigned.length > 0 && (
          <div className="print-unassigned">
            <h3 className="print-section-title--sub">Unassigned Guests</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest Name</th>
                  <th>RSVP</th>
                </tr>
              </thead>
              <tbody>
                {groupedGuests.unassigned.map((g, i) => (
                  <tr key={i}>
                    <td className="print-table__num">{i + 1}</td>
                    <td>{g.name}</td>
                    <td>
                      <span
                        className={`print-rsvp-badge print-rsvp-badge--${g.rsvp ?? 'pending'}`}
                      >
                        {g.rsvp === 'attending'
                          ? 'Attending'
                          : g.rsvp === 'not_attending'
                            ? 'Declined'
                            : g.rsvp === 'maybe'
                              ? 'Maybe'
                              : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="print-footer">
          <p>
            Generated by Seatly ·{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
