import { Link, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useTables } from '@/hooks/use-tables';
import { LoadingScreen, ErrorScreen } from '@/components/ui/feedback';
import type { GuestWithTable } from '@/types/guest';
import type { RSVP } from '@/types/rsvp';

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

function rsvpBadgeClass(status: RSVP['status']): string {
  return `print-rsvp-badge print-rsvp-badge--${status}`;
}

function rsvpLabel(status: RSVP['status']): string {
  switch (status) {
    case 'attending':
      return 'Attending';
    case 'not_attending':
      return 'Not Attending';
    case 'maybe':
      return 'Maybe';
    default:
      return status;
  }
}

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';

  const { data: event, isLoading } = useEvent(id);
  const { data: guests } = useGuests(id);
  const { data: rsvps } = useRSVPs(id);
  const { data: tables } = useTables(id);

  if (isLoading) return <LoadingScreen label="Loading guest list…" />;

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

  const guestList = guests ?? [];
  const tableList = tables ?? [];
  const rsvpList = rsvps ?? [];

  const rsvpByGuest = new Map<string, RSVP>();
  for (const r of rsvpList) {
    rsvpByGuest.set(r.guest_id, r);
  }

  const totalGuests = guestList.length;
  const attending = rsvpList.filter((r) => r.status === 'attending').length;
  const declined = rsvpList.filter((r) => r.status === 'not_attending').length;
  const pending = totalGuests - rsvpList.length;

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

  const sortedTables = [...tableList].sort((a, b) => a.number - b.number);

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

        <div className="print-summary">
          <div className="print-summary__item">
            <div className="print-summary__value">{totalGuests}</div>
            <div className="print-summary__label">Total Guests</div>
          </div>
          <div className="print-summary__item print-summary__item--success">
            <div className="print-summary__value">{attending}</div>
            <div className="print-summary__label">Attending</div>
          </div>
          <div className="print-summary__item print-summary__item--error">
            <div className="print-summary__value">{declined}</div>
            <div className="print-summary__label">Declined</div>
          </div>
          <div className="print-summary__item print-summary__item--warning">
            <div className="print-summary__value">{pending}</div>
            <div className="print-summary__label">Pending</div>
          </div>
        </div>

        <h2 className="print-section-title">Guest List by Table</h2>

        <div className="print-guest-list">
          {sortedTables.length === 0 && unassignedGuests.length === 0 ? (
            <p className="text-secondary">No guests yet.</p>
          ) : (
            sortedTables.map((table) => {
              const tableGuests = guestsByTable.get(table.id) ?? [];
              return (
                <div key={table.id} className="print-guest-list__section">
                  <div className="print-guest-list__table-header">
                    <span className="print-guest-list__table-name">
                      {table.name} (#{table.number})
                    </span>
                    <span className="print-guest-list__table-count">
                      {tableGuests.length} guest
                      {tableGuests.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <table className="print-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Guest Name</th>
                        <th>RSVP Status</th>
                        <th>Plus Ones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableGuests.length === 0 ? (
                        <tr>
                          <td className="print-table__num">—</td>
                          <td className="print-guest-name--empty">
                            No guests assigned
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      ) : (
                        tableGuests.map((g, idx) => {
                          const rsvp = rsvpByGuest.get(g.id);
                          return (
                            <tr key={g.id}>
                              <td className="print-table__num">{idx + 1}</td>
                              <td>{g.name}</td>
                              <td>
                                {rsvp ? (
                                  <span className={rsvpBadgeClass(rsvp.status)}>
                                    {rsvpLabel(rsvp.status)}
                                  </span>
                                ) : (
                                  <span className="print-rsvp-badge print-rsvp-badge--pending">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td>{rsvp ? rsvp.plus_ones : 0}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}

          {unassignedGuests.length > 0 && (
            <div className="print-guest-list__section">
              <div className="print-guest-list__table-header">
                <span className="print-guest-list__table-name">Unassigned</span>
                <span className="print-guest-list__table-count">
                  {unassignedGuests.length} guest
                  {unassignedGuests.length === 1 ? '' : 's'}
                </span>
              </div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Guest Name</th>
                    <th>RSVP Status</th>
                    <th>Plus Ones</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedGuests.map((g, idx) => {
                    const rsvp = rsvpByGuest.get(g.id);
                    return (
                      <tr key={g.id}>
                        <td className="print-table__num">{idx + 1}</td>
                        <td>{g.name}</td>
                        <td>
                          {rsvp ? (
                            <span className={rsvpBadgeClass(rsvp.status)}>
                              {rsvpLabel(rsvp.status)}
                            </span>
                          ) : (
                            <span className="print-rsvp-badge print-rsvp-badge--pending">
                              Pending
                            </span>
                          )}
                        </td>
                        <td>{rsvp ? rsvp.plus_ones : 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="print-footer">Generated {formatGeneratedDate()}</div>
      </div>
    </div>
  );
}
