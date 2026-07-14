import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading: eventLoading } = useEvent(eid);
  const { data: tables = [], isLoading: tablesLoading } = useTables(eid);
  const { data: guests = [], isLoading: guestsLoading } = useGuests(eid);

  const loading = eventLoading || tablesLoading || guestsLoading;

  // Group guests by table
  const guestsByTable = new Map<string, typeof guests>();
  for (const guest of guests) {
    if (!guest.table_id) continue;
    const list = guestsByTable.get(guest.table_id) ?? [];
    list.push(guest);
    guestsByTable.set(guest.table_id, list);
  }

  const unassigned = guests.filter((g) => !g.table_id);

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        .psc-page {
          min-height: 100vh;
          background: #F8F8F8;
          padding: 32px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1A1A1A;
        }
        .psc-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .psc-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .psc-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #4A4A4A;
          text-decoration: none;
          transition: color 0.15s;
        }
        .psc-back:hover {
          color: #1A1A1A;
        }
        .psc-actions {
          display: flex;
          gap: 12px;
        }
        .psc-print-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          height: 44px;
          background: #1A1A1A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .psc-print-btn:hover {
          opacity: 0.85;
        }
        .psc-sheet {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 16px;
          padding: 48px;
        }
        .psc-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 2px solid #1A1A1A;
        }
        .psc-eyebrow {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #4A4A4A;
          margin: 0 0 8px 0;
        }
        .psc-event-name {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .psc-event-meta {
          font-size: 14px;
          color: #4A4A4A;
          margin: 0;
        }
        .psc-summary {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .psc-summary-item {
          text-align: center;
        }
        .psc-summary-value {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .psc-summary-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #4A4A4A;
          margin: 4px 0 0 0;
        }
        .psc-tables-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 700px) {
          .psc-tables-grid { grid-template-columns: 1fr; }
        }
        .psc-table-card {
          border: 1px solid #EFEFEF;
          border-radius: 12px;
          padding: 20px;
          background: #FFFFFF;
        }
        .psc-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #EFEFEF;
        }
        .psc-table-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        .psc-table-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          background: #1A1A1A;
          color: #FFFFFF;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
        }
        .psc-guest-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .psc-guest-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #1A1A1A;
          padding: 6px 0;
        }
        .psc-guest-name {
          font-weight: 500;
        }
        .psc-guest-party {
          color: #4A4A4A;
          font-size: 12px;
        }
        .psc-empty-table {
          font-size: 13px;
          color: #DADADA;
          font-style: italic;
          padding: 8px 0;
        }
        .psc-unassigned {
          margin-top: 32px;
          padding: 20px;
          border: 1px dashed #DADADA;
          border-radius: 12px;
        }
        .psc-unassigned-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #4A4A4A;
        }
        .psc-unassigned-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .psc-unassigned-item {
          font-size: 13px;
          color: #4A4A4A;
        }
        .psc-loading {
          text-align: center;
          padding: 80px 24px;
          color: #4A4A4A;
          font-size: 14px;
        }
        .psc-loading-spinner {
          display: inline-block;
          width: 32px;
          height: 32px;
          border: 3px solid #EFEFEF;
          border-top-color: #1A1A1A;
          border-radius: 50%;
          animation: psc-spin 0.6s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes psc-spin {
          to { transform: rotate(360deg); }
        }
        @media print {
          .psc-page {
            background: #FFFFFF;
            padding: 0;
          }
          .psc-toolbar {
            display: none !important;
          }
          .psc-sheet {
            border: none;
            border-radius: 0;
            padding: 0;
          }
          .psc-table-card {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="psc-page">
        <div className="psc-container">
          {/* Toolbar (hidden on print) */}
          <div className="psc-toolbar">
            <Link to={`/events/${eid}`} className="psc-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Event
            </Link>
            <div className="psc-actions">
              <button className="psc-print-btn" onClick={handlePrint}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6V2h8v4M4 12H2.5A1.5 1.5 0 0 1 1 10.5V7a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 15 7v3.5a1.5 1.5 0 0 1-1.5 1.5H12M4 10h8v4H4v-4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Print
              </button>
            </div>
          </div>

          {loading ? (
            <div className="psc-sheet">
              <div className="psc-loading">
                <div className="psc-loading-spinner" />
                <p>Loading seating chart...</p>
              </div>
            </div>
          ) : !event ? (
            <div className="psc-sheet">
              <div className="psc-loading">
                <p>Event not found.</p>
              </div>
            </div>
          ) : (
            <div className="psc-sheet">
              {/* Header */}
              <div className="psc-header">
                <p className="psc-eyebrow">Seating Chart</p>
                <h1 className="psc-event-name">{event.name}</h1>
                <p className="psc-event-meta">
                  {event.date
                    ? new Date(event.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Date TBD'}
                  {event.venue ? ` · ${event.venue}` : ''}
                </p>
              </div>

              {/* Summary */}
              <div className="psc-summary">
                <div className="psc-summary-item">
                  <p className="psc-summary-value">{tables.length}</p>
                  <p className="psc-summary-label">Tables</p>
                </div>
                <div className="psc-summary-item">
                  <p className="psc-summary-value">{guests.length}</p>
                  <p className="psc-summary-label">Guests</p>
                </div>
                <div className="psc-summary-item">
                  <p className="psc-summary-value">
                    {tables.reduce((sum, t) => sum + t.capacity, 0)}
                  </p>
                  <p className="psc-summary-label">Total Seats</p>
                </div>
                <div className="psc-summary-item">
                  <p className="psc-summary-value">{unassigned.length}</p>
                  <p className="psc-summary-label">Unassigned</p>
                </div>
              </div>

              {/* Tables */}
              <div className="psc-tables-grid">
                {tables.map((table) => {
                  const tableGuests = guestsByTable.get(table.id) ?? [];
                  return (
                    <div key={table.id} className="psc-table-card">
                      <div className="psc-table-header">
                        <h3 className="psc-table-name">
                          {table.name || `Table ${table.number}`}
                        </h3>
                        <span className="psc-table-number">{table.number}</span>
                      </div>
                      {tableGuests.length === 0 ? (
                        <p className="psc-empty-table">No guests assigned</p>
                      ) : (
                        <ul className="psc-guest-list">
                          {tableGuests.map((guest) => (
                            <li key={guest.id} className="psc-guest-item">
                              <span className="psc-guest-name">{guest.name}</span>
                              {guest.party_size > 1 && (
                                <span className="psc-guest-party">
                                  {guest.party_size} guests
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Unassigned guests */}
              {unassigned.length > 0 && (
                <div className="psc-unassigned">
                  <p className="psc-unassigned-title">
                    Unassigned Guests ({unassigned.length})
                  </p>
                  <ul className="psc-unassigned-list">
                    {unassigned.map((guest) => (
                      <li key={guest.id} className="psc-unassigned-item">
                        {guest.name}
                        {guest.party_size > 1 ? ` (${guest.party_size})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
