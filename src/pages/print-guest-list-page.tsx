import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import type { GuestWithTable } from '@/types/guest';

const PGL_CSS = `
.pgl-root {
  min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif;
  color: #1A1A1A; padding: 32px 24px 64px; box-sizing: border-box;
}
.pgl-container { max-width: 900px; margin: 0 auto; }

/* ---- Toolbar (hidden in print) ---- */
.pgl-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-bottom: 28px; flex-wrap: wrap;
}
.pgl-toolbar-left { display: flex; align-items: center; gap: 12px; }
.pgl-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 14px;
  border: 1px solid #DADADA; border-radius: 10px;
  background: #FFFFFF; color: #4A4A4A; font-size: 13px; font-weight: 500;
  font-family: inherit; text-decoration: none; cursor: pointer;
  transition: all 200ms ease;
}
.pgl-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.pgl-print-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 44px; padding: 0 20px;
  border: none; border-radius: 12px;
  background: #1A1A1A; color: #FFFFFF;
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background 200ms ease;
}
.pgl-print-btn:hover { background: #333333; }

/* ---- Header ---- */
.pgl-header { margin-bottom: 32px; }
.pgl-header h1 {
  margin: 0 0 6px; font-size: 28px; font-weight: 700; color: #1A1A1A;
  letter-spacing: -0.5px;
}
.pgl-header-meta { font-size: 14px; color: #4A4A4A; margin: 0; }
.pgl-header-meta span { margin-right: 16px; }
.pgl-header-meta span:last-child { margin-right: 0; }

/* ---- Stats ---- */
.pgl-stats {
  display: flex; gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
}
.pgl-stat {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 12px;
  padding: 16px 20px; flex: 1; min-width: 140px;
}
.pgl-stat-label {
  font-size: 12px; font-weight: 600; color: #4A4A4A;
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
}
.pgl-stat-value { font-size: 24px; font-weight: 700; color: #1A1A1A; }

/* ---- Guest table ---- */
.pgl-table-wrap {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 14px;
  overflow: hidden;
}
.pgl-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.pgl-table thead { background: #F8F8F8; }
.pgl-table th {
  text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600;
  color: #4A4A4A; text-transform: uppercase; letter-spacing: 0.5px;
  border-bottom: 1px solid #EFEFEF;
}
.pgl-table td {
  padding: 12px 16px; border-bottom: 1px solid #EFEFEF; color: #1A1A1A;
}
.pgl-table tbody tr:last-child td { border-bottom: none; }
.pgl-table tbody tr:hover { background: #F8F8F8; }

.pgl-guest-name { font-weight: 600; }
.pgl-table-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 26px; padding: 0 8px; border-radius: 8px;
  background: #1A1A1A; color: #FFFFFF; font-size: 12px; font-weight: 700;
}
.pgl-table-badge--none {
  background: #EFEFEF; color: #4A4A4A; font-weight: 500; min-width: auto;
  padding: 0 10px;
}
.pgl-contact { font-size: 13px; color: #4A4A4A; }
.pgl-contact--none { color: #B0B0B0; font-style: italic; }
.pgl-dietary {
  font-size: 13px; color: #4A4A4A; max-width: 200px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pgl-dietary--none { color: #B0B0B0; font-style: italic; }
.pgl-empty-row { text-align: center; padding: 40px 16px; color: #B0B0B0; font-size: 14px; }

/* ---- Loading / Error ---- */
.pgl-loading, .pgl-error { text-align: center; padding: 80px 20px; }
.pgl-loading-dot {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #EFEFEF; border-top-color: #1A1A1A;
  animation: pgl-spin 0.7s linear infinite; margin: 0 auto 16px;
}
@keyframes pgl-spin { to { transform: rotate(360deg); } }
.pgl-loading-text { font-size: 14px; color: #4A4A4A; }
.pgl-error-icon {
  width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 14px;
  background: #EFEFEF; display: flex; align-items: center; justify-content: center;
  color: #4A4A4A;
}
.pgl-error h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #1A1A1A; }
.pgl-error p { margin: 0; font-size: 14px; color: #4A4A4A; }

/* ---- Print styles ---- */
@media print {
  .pgl-root { background: #FFFFFF; padding: 0; }
  .pgl-toolbar { display: none !important; }
  .pgl-table-wrap { border: 1px solid #DADADA; }
  .pgl-table th { background: #F8F8F8; }
  .pgl-table tbody tr:hover { background: transparent; }
  .pgl-container { max-width: 100%; }
  @page { margin: 1.5cm; }
}
`;

function formatPglDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading: eventLoading } = useEvent(eid || undefined);
  const { data: guests = [], isLoading: guestsLoading } = useGuests(eid || undefined);

  const isLoading = eventLoading || guestsLoading;

  const assignedCount = guests.filter((g) => g.table_id !== null).length;
  const unassignedCount = guests.length - assignedCount;
  const totalParty = guests.reduce((sum, g) => sum + (g.party_size || 1), 0);

  // Sort guests alphabetically by name
  const sortedGuests = [...guests].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="pgl-root">
      <style>{PGL_CSS}</style>
      <div className="pgl-container">
        {/* Toolbar */}
        <div className="pgl-toolbar">
          <div className="pgl-toolbar-left">
            <Link to={`/e/${eid}`} className="pgl-back-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Event
            </Link>
          </div>
          <button className="pgl-print-btn" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6V2h8v4M4 11H2V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h-2M4 9h8v5H4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Print Guest List
          </button>
        </div>

        {isLoading ? (
          <div className="pgl-loading">
            <div className="pgl-loading-dot" />
            <p className="pgl-loading-text">Loading guest list...</p>
          </div>
        ) : !event ? (
          <div className="pgl-error">
            <div className="pgl-error-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2>Event Not Found</h2>
            <p>This event may have been removed.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="pgl-header">
              <h1>Guest List — {event.name}</h1>
              <p className="pgl-header-meta">
                {event.date && <span>{formatPglDate(event.date)}</span>}
                {event.venue && <span>{event.venue}</span>}
              </p>
            </div>

            {/* Stats */}
            <div className="pgl-stats">
              <div className="pgl-stat">
                <div className="pgl-stat-label">Total Guests</div>
                <div className="pgl-stat-value">{guests.length}</div>
              </div>
              <div className="pgl-stat">
                <div className="pgl-stat-label">Total Party Size</div>
                <div className="pgl-stat-value">{totalParty}</div>
              </div>
              <div className="pgl-stat">
                <div className="pgl-stat-label">Assigned</div>
                <div className="pgl-stat-value">{assignedCount}</div>
              </div>
              <div className="pgl-stat">
                <div className="pgl-stat-label">Unassigned</div>
                <div className="pgl-stat-value">{unassignedCount}</div>
              </div>
            </div>

            {/* Guest table */}
            <div className="pgl-table-wrap">
              <table className="pgl-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Name</th>
                    <th style={{ width: '15%' }}>Party Size</th>
                    <th style={{ width: '15%' }}>Table</th>
                    <th style={{ width: '22%' }}>Contact</th>
                    <th style={{ width: '20%' }}>Dietary Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGuests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="pgl-empty-row">
                        No guests have been added yet.
                      </td>
                    </tr>
                  ) : (
                    sortedGuests.map((g: GuestWithTable) => (
                      <tr key={g.id}>
                        <td className="pgl-guest-name">{g.name}</td>
                        <td>{g.party_size}</td>
                        <td>
                          {g.table ? (
                            <span className="pgl-table-badge">
                              {g.table.number}
                            </span>
                          ) : (
                            <span className="pgl-table-badge pgl-table-badge--none">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          {g.email || g.phone ? (
                            <span className="pgl-contact">
                              {g.email || g.phone}
                            </span>
                          ) : (
                            <span className="pgl-contact pgl-contact--none">
                              —
                            </span>
                          )}
                        </td>
                        <td>
                          {g.dietary_notes ? (
                            <span className="pgl-dietary" title={g.dietary_notes}>
                              {g.dietary_notes}
                            </span>
                          ) : (
                            <span className="pgl-dietary pgl-dietary--none">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
