import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

const PSC_CSS = `
.psc-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', system-ui, sans-serif; color: #1A1A1A; }

/* Toolbar — hidden on print */
.psc-toolbar {
  background: #FFFFFF; border-bottom: 1px solid #EFEFEF; padding: 16px 32px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  position: sticky; top: 0; z-index: 100;
}
.psc-toolbar-left { display: flex; align-items: center; gap: 12px; }
.psc-back-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 16px;
  border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; color: #4A4A4A;
  font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none;
  transition: all 200ms ease; font-family: inherit;
}
.psc-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.psc-print-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px;
  border: 1px solid #1A1A1A; border-radius: 12px; background: #1A1A1A; color: #FFFFFF;
  font-size: 14px; font-weight: 500; cursor: pointer; transition: background 200ms ease; font-family: inherit;
}
.psc-print-btn:hover { background: #333333; }

/* Document */
.psc-doc { max-width: 900px; margin: 0 auto; padding: 48px 32px; }
.psc-header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #1A1A1A; }
.psc-eyebrow {
  font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase;
  letter-spacing: 0.15em; margin: 0 0 8px;
}
.psc-title { font-size: 32px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px; letter-spacing: -0.02em; }
.psc-subtitle { font-size: 14px; color: #4A4A4A; margin: 0; }
.psc-meta { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
.psc-meta-item { font-size: 13px; color: #4A4A4A; display: flex; align-items: center; gap: 4px; }
.psc-meta-item svg { color: #B0B0B0; }

/* Table blocks */
.psc-tables { display: flex; flex-direction: column; gap: 20px; }
.psc-table {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden;
  page-break-inside: avoid;
}
.psc-table-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; background: #1A1A1A; color: #FFFFFF;
}
.psc-table-num { font-size: 18px; font-weight: 700; }
.psc-table-name { font-size: 14px; font-weight: 500; opacity: 0.8; }
.psc-table-cap { font-size: 12px; opacity: 0.6; }
.psc-guest-list { list-style: none; margin: 0; padding: 0; }
.psc-guest-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #F8F8F8;
}
.psc-guest-item:last-child { border-bottom: none; }
.psc-guest-name { font-weight: 500; }
.psc-guest-party { font-size: 12px; color: #B0B0B0; }
.psc-guest-empty { padding: 20px; text-align: center; font-size: 13px; color: #B0B0B0; }

/* Summary */
.psc-summary {
  margin-top: 32px; padding: 20px; background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px;
  display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;
}
.psc-summary-item { text-align: center; }
.psc-summary-label { font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; }
.psc-summary-value { font-size: 24px; font-weight: 700; color: #1A1A1A; margin-top: 2px; }

/* Loading / error */
.psc-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F8F8F8; }
.psc-spinner { width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A; border-radius: 50%; animation: psc-spin 0.8s linear infinite; }
@keyframes psc-spin { to { transform: rotate(360deg); } }
.psc-error { text-align: center; padding: 64px 32px; }
.psc-error-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0 0 8px; }
.psc-error-text { font-size: 14px; color: #B0B0B0; margin: 0 0 24px; }
.psc-error-link {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px;
  border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 500;
  text-decoration: none; transition: background 200ms ease;
}
.psc-error-link:hover { background: #333333; }

/* Print */
@media print {
  .psc-toolbar { display: none !important; }
  .psc-root { background: #FFFFFF; }
  .psc-doc { padding: 0; max-width: 100%; }
  .psc-table { box-shadow: none; page-break-inside: avoid; }
  .psc-summary { box-shadow: none; }
}
`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useEvent(eventId ?? '');
  const { data: tables } = useTables(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');

  if (isLoading) {
    return (
      <div className="psc-loading">
        <style>{PSC_CSS}</style>
        <div className="psc-spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="psc-root">
        <style>{PSC_CSS}</style>
        <div className="psc-error">
          <h2 className="psc-error-title">Event not found</h2>
          <p className="psc-error-text">The event you're looking for doesn't exist.</p>
          <Link to="/" className="psc-error-link">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const totalGuests = guests?.length ?? 0;
  const assignedGuests = guests?.filter((g) => g.table_id).length ?? 0;
  const unassignedGuests = totalGuests - assignedGuests;

  return (
    <div className="psc-root">
      <style>{PSC_CSS}</style>

      {/* Toolbar */}
      <div className="psc-toolbar">
        <div className="psc-toolbar-left">
          <Link to={`/event/${event.id}`} className="psc-back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Event
          </Link>
        </div>
        <button className="psc-print-btn" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5V2h8v3M4 11H2.5V7a1 1 0 011-1h9a1 1 0 011 1v4H12M4 9h8v5H4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Print Seating Chart
        </button>
      </div>

      {/* Document */}
      <div className="psc-doc">
        <div className="psc-header">
          <p className="psc-eyebrow">Seating Chart</p>
          <h1 className="psc-title">{event.name}</h1>
          <div className="psc-meta">
            {event.date && (
              <span className="psc-meta-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="10" height="10" rx="1.5" />
                  <path d="M3 7h10M6 2v4M10 2v4" strokeLinecap="round" />
                </svg>
                {formatDate(event.date)}
                {event.time ? ` · ${event.time}` : ''}
              </span>
            )}
            {event.venue && (
              <span className="psc-meta-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 14s5-4.5 5-8a5 5 0 10-10 0c0 3.5 5 8 5 8z" />
                  <circle cx="8" cy="6" r="2" />
                </svg>
                {event.venue}
              </span>
            )}
          </div>
        </div>

        {/* Tables */}
        <div className="psc-tables">
          {tables && tables.length > 0 ? (
            tables.map((table) => {
              const tableGuests = guests?.filter((g) => g.table_id === table.id) ?? [];
              return (
                <div key={table.id} className="psc-table">
                  <div className="psc-table-head">
                    <div>
                      <span className="psc-table-num">Table {table.number}</span>
                      {table.name && <span className="psc-table-name"> — {table.name}</span>}
                    </div>
                    <span className="psc-table-cap">
                      {tableGuests.length} / {table.capacity} seats
                    </span>
                  </div>
                  {tableGuests.length > 0 ? (
                    <ul className="psc-guest-list">
                      {tableGuests.map((g) => (
                        <li key={g.id} className="psc-guest-item">
                          <span className="psc-guest-name">{g.name}</span>
                          {g.party_size > 1 && (
                            <span className="psc-guest-party">Party of {g.party_size}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="psc-guest-empty">No guests assigned</div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="psc-guest-empty">No tables created for this event.</div>
          )}
        </div>

        {/* Unassigned guests */}
        {unassignedGuests > 0 && (
          <div className="psc-table" style={{ marginTop: '20px' }}>
            <div className="psc-table-head" style={{ background: '#4A4A4A' }}>
              <span className="psc-table-num">Unassigned Guests</span>
              <span className="psc-table-cap">{unassignedGuests} guests</span>
            </div>
            <ul className="psc-guest-list">
              {guests?.filter((g) => !g.table_id).map((g) => (
                <li key={g.id} className="psc-guest-item">
                  <span className="psc-guest-name">{g.name}</span>
                  {g.party_size > 1 && (
                    <span className="psc-guest-party">Party of {g.party_size}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        <div className="psc-summary">
          <div className="psc-summary-item">
            <div className="psc-summary-label">Tables</div>
            <div className="psc-summary-value">{tables?.length ?? 0}</div>
          </div>
          <div className="psc-summary-item">
            <div className="psc-summary-label">Total Guests</div>
            <div className="psc-summary-value">{totalGuests}</div>
          </div>
          <div className="psc-summary-item">
            <div className="psc-summary-label">Assigned</div>
            <div className="psc-summary-value">{assignedGuests}</div>
          </div>
          <div className="psc-summary-item">
            <div className="psc-summary-label">Unassigned</div>
            <div className="psc-summary-value">{unassignedGuests}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
