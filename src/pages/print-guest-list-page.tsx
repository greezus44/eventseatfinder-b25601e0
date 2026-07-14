import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

const PGL_CSS = `
.pgl-root { min-height: 100vh; background: #F8F8F8; font-family: 'Inter', system-ui, sans-serif; color: #1A1A1A; }

/* Toolbar — hidden on print */
.pgl-toolbar {
  background: #FFFFFF; border-bottom: 1px solid #EFEFEF; padding: 16px 32px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  position: sticky; top: 0; z-index: 100;
}
.pgl-toolbar-left { display: flex; align-items: center; gap: 12px; }
.pgl-back-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 16px;
  border: 1px solid #DADADA; border-radius: 12px; background: #FFFFFF; color: #4A4A4A;
  font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none;
  transition: all 200ms ease; font-family: inherit;
}
.pgl-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.pgl-print-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px;
  border: 1px solid #1A1A1A; border-radius: 12px; background: #1A1A1A; color: #FFFFFF;
  font-size: 14px; font-weight: 500; cursor: pointer; transition: background 200ms ease; font-family: inherit;
}
.pgl-print-btn:hover { background: #333333; }

/* Document */
.pgl-doc { max-width: 800px; margin: 0 auto; padding: 48px 32px; }
.pgl-header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #1A1A1A; }
.pgl-eyebrow {
  font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase;
  letter-spacing: 0.15em; margin: 0 0 8px;
}
.pgl-title { font-size: 32px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px; letter-spacing: -0.02em; }
.pgl-meta { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
.pgl-meta-item { font-size: 13px; color: #4A4A4A; display: flex; align-items: center; gap: 4px; }
.pgl-meta-item svg { color: #B0B0B0; }

/* Guest table */
.pgl-table-wrap { background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px; overflow: hidden; }
.pgl-table { width: 100%; border-collapse: collapse; }
.pgl-table th {
  text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600;
  color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em;
  background: #F8F8F8; border-bottom: 1px solid #EFEFEF;
}
.pgl-table td {
  padding: 12px 16px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #F8F8F8;
}
.pgl-table tr:last-child td { border-bottom: none; }
.pgl-table tr:nth-child(even) { background: #FAFAFA; }
.pgl-guest-name { font-weight: 600; }
.pgl-table-badge {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 500;
}
.pgl-table-badge--assigned { background: #1A1A1A; color: #FFFFFF; }
.pgl-table-badge--unassigned { background: #EFEFEF; color: #4A4A4A; }
.pgl-empty { padding: 48px; text-align: center; font-size: 14px; color: #B0B0B0; }

/* Summary */
.pgl-summary {
  margin-top: 24px; padding: 20px; background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px;
  display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;
}
.pgl-summary-item { text-align: center; }
.pgl-summary-label { font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; }
.pgl-summary-value { font-size: 24px; font-weight: 700; color: #1A1A1A; margin-top: 2px; }

/* Loading / error */
.pgl-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F8F8F8; }
.pgl-spinner { width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A; border-radius: 50%; animation: pgl-spin 0.8s linear infinite; }
@keyframes pgl-spin { to { transform: rotate(360deg); } }
.pgl-error { text-align: center; padding: 64px 32px; }
.pgl-error-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin: 0 0 8px; }
.pgl-error-text { font-size: 14px; color: #B0B0B0; margin: 0 0 24px; }
.pgl-error-link {
  display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px;
  border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 500;
  text-decoration: none; transition: background 200ms ease;
}
.pgl-error-link:hover { background: #333333; }

/* Print */
@media print {
  .pgl-toolbar { display: none !important; }
  .pgl-root { background: #FFFFFF; }
  .pgl-doc { padding: 0; max-width: 100%; }
  .pgl-table-wrap { box-shadow: none; }
  .pgl-summary { box-shadow: none; }
  .pgl-table tr { page-break-inside: avoid; }
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

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading } = useEvent(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');

  if (isLoading) {
    return (
      <div className="pgl-loading">
        <style>{PGL_CSS}</style>
        <div className="pgl-spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pgl-root">
        <style>{PGL_CSS}</style>
        <div className="pgl-error">
          <h2 className="pgl-error-title">Event not found</h2>
          <p className="pgl-error-text">The event you're looking for doesn't exist.</p>
          <Link to="/" className="pgl-error-link">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const totalGuests = guests?.length ?? 0;
  const assignedGuests = guests?.filter((g) => g.table_id).length ?? 0;
  const unassignedGuests = totalGuests - assignedGuests;

  // Sort guests alphabetically by name
  const sortedGuests = [...(guests ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="pgl-root">
      <style>{PGL_CSS}</style>

      {/* Toolbar */}
      <div className="pgl-toolbar">
        <div className="pgl-toolbar-left">
          <Link to={`/event/${event.id}`} className="pgl-back-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Event
          </Link>
        </div>
        <button className="pgl-print-btn" onClick={() => window.print()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5V2h8v3M4 11H2.5V7a1 1 0 011-1h9a1 1 0 011 1v4H12M4 9h8v5H4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Print Guest List
        </button>
      </div>

      {/* Document */}
      <div className="pgl-doc">
        <div className="pgl-header">
          <p className="pgl-eyebrow">Guest List</p>
          <h1 className="pgl-title">{event.name}</h1>
          <div className="pgl-meta">
            {event.date && (
              <span className="pgl-meta-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="10" height="10" rx="1.5" />
                  <path d="M3 7h10M6 2v4M10 2v4" strokeLinecap="round" />
                </svg>
                {formatDate(event.date)}
                {event.time ? ` · ${event.time}` : ''}
              </span>
            )}
            {event.venue && (
              <span className="pgl-meta-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 14s5-4.5 5-8a5 5 0 10-10 0c0 3.5 5 8 5 8z" />
                  <circle cx="8" cy="6" r="2" />
                </svg>
                {event.venue}
              </span>
            )}
          </div>
        </div>

        {/* Guest table */}
        <div className="pgl-table-wrap">
          {sortedGuests.length > 0 ? (
            <table className="pgl-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Guest Name</th>
                  <th>Table</th>
                  <th>Party Size</th>
                  <th>Dietary Notes</th>
                </tr>
              </thead>
              <tbody>
                {sortedGuests.map((g, i) => (
                  <tr key={g.id}>
                    <td>{i + 1}</td>
                    <td className="pgl-guest-name">{g.name}</td>
                    <td>
                      {g.table ? (
                        <span className="pgl-table-badge pgl-table-badge--assigned">
                          Table {g.table.number}
                        </span>
                      ) : (
                        <span className="pgl-table-badge pgl-table-badge--unassigned">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>{g.party_size}</td>
                    <td>{g.dietary_notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="pgl-empty">No guests have been added to this event.</div>
          )}
        </div>

        {/* Summary */}
        <div className="pgl-summary">
          <div className="pgl-summary-item">
            <div className="pgl-summary-label">Total Guests</div>
            <div className="pgl-summary-value">{totalGuests}</div>
          </div>
          <div className="pgl-summary-item">
            <div className="pgl-summary-label">Assigned</div>
            <div className="pgl-summary-value">{assignedGuests}</div>
          </div>
          <div className="pgl-summary-item">
            <div className="pgl-summary-label">Unassigned</div>
            <div className="pgl-summary-value">{unassignedGuests}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
