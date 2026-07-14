import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading: eventLoading } = useEvent(eid);
  const { data: guests = [], isLoading: guestsLoading } = useGuests(eid);

  const loading = eventLoading || guestsLoading;

  const sortedGuests = [...guests].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const assignedCount = guests.filter((g) => g.table_id).length;
  const unassignedCount = guests.length - assignedCount;

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        .pgl-page {
          min-height: 100vh;
          background: #F8F8F8;
          padding: 32px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1A1A1A;
        }
        .pgl-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .pgl-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pgl-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #4A4A4A;
          text-decoration: none;
          transition: color 0.15s;
        }
        .pgl-back:hover {
          color: #1A1A1A;
        }
        .pgl-actions {
          display: flex;
          gap: 12px;
        }
        .pgl-print-btn {
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
        .pgl-print-btn:hover {
          opacity: 0.85;
        }
        .pgl-sheet {
          background: #FFFFFF;
          border: 1px solid #EFEFEF;
          border-radius: 16px;
          padding: 48px;
        }
        .pgl-header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #1A1A1A;
        }
        .pgl-eyebrow {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #4A4A4A;
          margin: 0 0 8px 0;
        }
        .pgl-event-name {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .pgl-event-meta {
          font-size: 14px;
          color: #4A4A4A;
          margin: 0;
        }
        .pgl-summary {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .pgl-summary-item {
          text-align: center;
        }
        .pgl-summary-value {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .pgl-summary-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #4A4A4A;
          margin: 4px 0 0 0;
        }
        .pgl-table-header-row {
          display: grid;
          grid-template-columns: 1fr 100px 80px 120px;
          gap: 12px;
          padding: 12px 16px;
          background: #F8F8F8;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #4A4A4A;
        }
        .pgl-guest-row {
          display: grid;
          grid-template-columns: 1fr 100px 80px 120px;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #EFEFEF;
          font-size: 14px;
          align-items: center;
        }
        .pgl-guest-row:last-child {
          border-bottom: none;
        }
        .pgl-guest-name {
          font-weight: 500;
          color: #1A1A1A;
        }
        .pgl-guest-contact {
          font-size: 12px;
          color: #4A4A4A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pgl-guest-party {
          font-size: 13px;
          color: #4A4A4A;
        }
        .pgl-guest-table {
          font-size: 13px;
          font-weight: 500;
          color: #1A1A1A;
        }
        .pgl-guest-table.unassigned {
          color: #DADADA;
          font-style: italic;
          font-weight: 400;
        }
        .pgl-empty {
          text-align: center;
          padding: 48px 24px;
          color: #4A4A4A;
          font-size: 14px;
        }
        .pgl-loading {
          text-align: center;
          padding: 80px 24px;
          color: #4A4A4A;
          font-size: 14px;
        }
        .pgl-loading-spinner {
          display: inline-block;
          width: 32px;
          height: 32px;
          border: 3px solid #EFEFEF;
          border-top-color: #1A1A1A;
          border-radius: 50%;
          animation: pgl-spin 0.6s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes pgl-spin {
          to { transform: rotate(360deg); }
        }
        @media print {
          .pgl-page {
            background: #FFFFFF;
            padding: 0;
          }
          .pgl-toolbar {
            display: none !important;
          }
          .pgl-sheet {
            border: none;
            border-radius: 0;
            padding: 0;
          }
          .pgl-guest-row {
            break-inside: avoid;
          }
        }
        @media (max-width: 600px) {
          .pgl-table-header-row,
          .pgl-guest-row {
            grid-template-columns: 1fr 60px 60px;
          }
          .pgl-table-header-row .pgl-col-contact,
          .pgl-guest-row .pgl-guest-contact {
            display: none;
          }
        }
      `}</style>

      <div className="pgl-page">
        <div className="pgl-container">
          {/* Toolbar (hidden on print) */}
          <div className="pgl-toolbar">
            <Link to={`/events/${eid}`} className="pgl-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Event
            </Link>
            <div className="pgl-actions">
              <button className="pgl-print-btn" onClick={handlePrint}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6V2h8v4M4 12H2.5A1.5 1.5 0 0 1 1 10.5V7a1.5 1.5 0 0 1 1.5-1.5h11A1.5 1.5 0 0 1 15 7v3.5a1.5 1.5 0 0 1-1.5 1.5H12M4 10h8v4H4v-4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Print
              </button>
            </div>
          </div>

          {loading ? (
            <div className="pgl-sheet">
              <div className="pgl-loading">
                <div className="pgl-loading-spinner" />
                <p>Loading guest list...</p>
              </div>
            </div>
          ) : !event ? (
            <div className="pgl-sheet">
              <div className="pgl-loading">
                <p>Event not found.</p>
              </div>
            </div>
          ) : (
            <div className="pgl-sheet">
              {/* Header */}
              <div className="pgl-header">
                <p className="pgl-eyebrow">Guest List</p>
                <h1 className="pgl-event-name">{event.name}</h1>
                <p className="pgl-event-meta">
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
              <div className="pgl-summary">
                <div className="pgl-summary-item">
                  <p className="pgl-summary-value">{guests.length}</p>
                  <p className="pgl-summary-label">Total Guests</p>
                </div>
                <div className="pgl-summary-item">
                  <p className="pgl-summary-value">
                    {guests.reduce((sum, g) => sum + g.party_size, 0)}
                  </p>
                  <p className="pgl-summary-label">Total Party</p>
                </div>
                <div className="pgl-summary-item">
                  <p className="pgl-summary-value">{assignedCount}</p>
                  <p className="pgl-summary-label">Assigned</p>
                </div>
                <div className="pgl-summary-item">
                  <p className="pgl-summary-value">{unassignedCount}</p>
                  <p className="pgl-summary-label">Unassigned</p>
                </div>
              </div>

              {/* Guest table */}
              {sortedGuests.length === 0 ? (
                <div className="pgl-empty">
                  No guests have been added to this event yet.
                </div>
              ) : (
                <>
                  <div className="pgl-table-header-row">
                    <span>Name</span>
                    <span className="pgl-col-contact">Contact</span>
                    <span>Party</span>
                    <span>Table</span>
                  </div>
                  {sortedGuests.map((guest) => (
                    <div key={guest.id} className="pgl-guest-row">
                      <span className="pgl-guest-name">{guest.name}</span>
                      <span className="pgl-guest-contact">
                        {guest.email || guest.phone || '—'}
                      </span>
                      <span className="pgl-guest-party">
                        {guest.party_size}
                      </span>
                      <span
                        className={`pgl-guest-table ${
                          guest.table ? '' : 'unassigned'
                        }`}
                      >
                        {guest.table
                          ? `${guest.table.number}${
                              guest.table.name ? ` · ${guest.table.name}` : ''
                            }`
                          : 'Unassigned'}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
