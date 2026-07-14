import { useNavigate, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useRSVPs } from '@/hooks/use-rsvps';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import type { RSVPStatus } from '@/types/rsvp';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(eid);
  const { data: guests } = useGuests(eid);
  const { data: rsvps } = useRSVPs(eid);
  const { data: tables } = useTables(eid);

  if (isLoading) return <div className="print-page">Loading...</div>;
  if (error || !event)
    return <div className="print-page">Event not found.</div>;

  const rsvpMap = new Map((rsvps ?? []).map((r) => [r.guest_id, r.status]));

  const totalGuests = guests?.length ?? 0;
  const attending = (rsvps ?? []).filter(
    (r) => r.status === 'attending',
  ).length;
  const declined = (rsvps ?? []).filter(
    (r) => r.status === 'not_attending',
  ).length;
  const pending = (rsvps ?? []).filter((r) => r.status === 'maybe').length;
  const unassigned = (guests ?? []).filter((g) => !g.table_id).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const rsvpBadgeClass = (status: RSVPStatus | undefined) => {
    if (status === 'attending')
      return 'print-rsvp-badge print-rsvp-badge--attending';
    if (status === 'not_attending')
      return 'print-rsvp-badge print-rsvp-badge--declined';
    return 'print-rsvp-badge print-rsvp-badge--pending';
  };

  const rsvpLabel = (status: RSVPStatus | undefined) => {
    if (status === 'attending') return 'Attending';
    if (status === 'not_attending') return 'Declined';
    if (status === 'maybe') return 'Maybe';
    return 'No RSVP';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(`/events/${eid}/overview`);
  };

  return (
    <div className="print-page">
      <div className="print-toolbar no-print">
        <button className="btn btn--primary" onClick={handlePrint}>
          Print
        </button>
        <button className="btn btn--secondary" onClick={handleBack}>
          Back
        </button>
      </div>

      <div className="print-document">
        <div className="print-header">
          <h1 className="print-title">{event.name}</h1>
          {event.venue && <p className="print-venue">{event.venue}</p>}
          <p className="print-date">{formatDate(event.date)}</p>
        </div>

        <div className="print-summary">
          <div className="print-summary__stat print-summary__stat--total">
            <span className="print-summary__number">{totalGuests}</span>
            <span className="print-summary__label">Total Guests</span>
          </div>
          <div className="print-summary__stat print-summary__stat--attending">
            <span className="print-summary__number">{attending}</span>
            <span className="print-summary__label">Attending</span>
          </div>
          <div className="print-summary__stat print-summary__stat--declined">
            <span className="print-summary__number">{declined}</span>
            <span className="print-summary__label">Declined</span>
          </div>
          <div className="print-summary__stat print-summary__stat--pending">
            <span className="print-summary__number">{pending}</span>
            <span className="print-summary__label">Pending</span>
          </div>
          <div className="print-summary__stat print-summary__stat--unassigned">
            <span className="print-summary__number">{unassigned}</span>
            <span className="print-summary__label">Unassigned</span>
          </div>
        </div>

        <h2 className="print-section-title">Guest List by Table</h2>

        <div className="print-guest-list">
          {(tables ?? []).map((table) => {
            const tableGuests = (guests ?? []).filter(
              (g) => g.table_id === table.id,
            );
            return (
              <div key={table.id} className="print-table">
                <div className="print-table__header">
                  <span className="print-table__name">{table.name}</span>
                  <span className="print-table__num">
                    Table #{table.number}
                  </span>
                </div>
                <div className="print-table__guests">
                  {tableGuests.length === 0 ? (
                    <p className="print-guest-name print-guest-name--empty">
                      No guests assigned
                    </p>
                  ) : (
                    tableGuests.map((g) => {
                      const rsvpStatus = rsvpMap.get(g.id);
                      return (
                        <div key={g.id} className="print-guest-row">
                          <span className="print-guest-name">{g.name}</span>
                          <span className={rsvpBadgeClass(rsvpStatus)}>
                            {rsvpLabel(rsvpStatus)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {unassigned > 0 && (
          <div className="print-guest-list">
            <div className="print-table">
              <div className="print-table__header">
                <span className="print-table__name">Unassigned</span>
              </div>
              <div className="print-table__guests">
                {(guests ?? [])
                  .filter((g) => !g.table_id)
                  .map((g) => {
                    const rsvpStatus = rsvpMap.get(g.id);
                    return (
                      <div key={g.id} className="print-guest-row">
                        <span className="print-guest-name">{g.name}</span>
                        <span className={rsvpBadgeClass(rsvpStatus)}>
                          {rsvpLabel(rsvpStatus)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div className="print-footer">
          <p>
            {event.name} — Guest List — Generated on{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
