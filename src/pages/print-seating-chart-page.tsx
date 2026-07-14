import { useNavigate, useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(eid);
  const { data: tables } = useTables(eid);
  const { data: guests } = useGuests(eid);

  if (isLoading) return <div className="print-page">Loading...</div>;
  if (error || !event)
    return <div className="print-page">Event not found.</div>;

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

  const unassigned = (guests ?? []).filter((g) => !g.table_id);

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

        <h2 className="print-section-title">Seating Chart</h2>

        <div className="print-tables-grid">
          {(tables ?? []).map((table) => {
            const tableGuests = (guests ?? []).filter(
              (g) => g.table_id === table.id,
            );
            return (
              <div key={table.id} className="print-table-card">
                <div className="print-table-card__header">
                  <span className="print-table-card__name">{table.name}</span>
                  <span className="print-table-card__number">
                    Table #{table.number}
                  </span>
                </div>
                <div className="print-table-card__guests">
                  {tableGuests.length === 0 ? (
                    <p className="print-guest-name print-guest-name--empty">
                      No guests assigned
                    </p>
                  ) : (
                    tableGuests.map((g) => (
                      <p key={g.id} className="print-guest-name">
                        {g.name}
                      </p>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {unassigned.length > 0 && (
          <div className="print-unassigned">
            <h2 className="print-section-title">Unassigned Guests</h2>
            <div className="print-unassigned-list">
              {unassigned.map((g) => (
                <p key={g.id} className="print-guest-name">
                  {g.name}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="print-footer">
          <p>
            {event.name} — Seating Chart — Generated on{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
