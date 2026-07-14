import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';

const PSC_CSS = `
.psc-root {
  min-height: 100vh; background: #F8F8F8; font-family: 'Inter', sans-serif;
  color: #1A1A1A; padding: 32px 24px 64px; box-sizing: border-box;
}
.psc-container { max-width: 900px; margin: 0 auto; }

/* ---- Toolbar (hidden in print) ---- */
.psc-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-bottom: 28px; flex-wrap: wrap;
}
.psc-toolbar-left { display: flex; align-items: center; gap: 12px; }
.psc-back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 14px;
  border: 1px solid #DADADA; border-radius: 10px;
  background: #FFFFFF; color: #4A4A4A; font-size: 13px; font-weight: 500;
  font-family: inherit; text-decoration: none; cursor: pointer;
  transition: all 200ms ease;
}
.psc-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.psc-print-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 44px; padding: 0 20px;
  border: none; border-radius: 12px;
  background: #1A1A1A; color: #FFFFFF;
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: background 200ms ease;
}
.psc-print-btn:hover { background: #333333; }

/* ---- Header ---- */
.psc-header { margin-bottom: 32px; }
.psc-header h1 {
  margin: 0 0 6px; font-size: 28px; font-weight: 700; color: #1A1A1A;
  letter-spacing: -0.5px;
}
.psc-header-meta { font-size: 14px; color: #4A4A4A; margin: 0; }
.psc-header-meta span { margin-right: 16px; }
.psc-header-meta span:last-child { margin-right: 0; }

/* ---- Table list ---- */
.psc-tables { display: flex; flex-direction: column; gap: 16px; }
.psc-table-card {
  background: #FFFFFF; border: 1px solid #EFEFEF; border-radius: 14px;
  overflow: hidden;
}
.psc-table-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #EFEFEF; background: #F8F8F8;
}
.psc-table-name { font-size: 16px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 8px; }
.psc-table-number {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 28px; padding: 0 8px; border-radius: 8px;
  background: #1A1A1A; color: #FFFFFF; font-size: 13px; font-weight: 700;
}
.psc-table-capacity { font-size: 13px; color: #4A4A4A; font-weight: 500; }
.psc-guest-list { list-style: none; margin: 0; padding: 0; }
.psc-guest-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; border-bottom: 1px solid #EFEFEF;
  font-size: 14px; color: #1A1A1A;
}
.psc-guest-item:last-child { border-bottom: none; }
.psc-guest-name { font-weight: 500; }
.psc-guest-party { font-size: 13px; color: #4A4A4A; }
.psc-guest-empty { padding: 16px 20px; font-size: 14px; color: #B0B0B0; font-style: italic; }

/* ---- Unassigned ---- */
.psc-unassigned { margin-top: 24px; }
.psc-unassigned-title {
  font-size: 16px; font-weight: 600; color: #1A1A1A; margin-bottom: 12px;
  padding-bottom: 8px; border-bottom: 2px solid #1A1A1A;
}

/* ---- Loading / Error ---- */
.psc-loading, .psc-error { text-align: center; padding: 80px 20px; }
.psc-loading-dot {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #EFEFEF; border-top-color: #1A1A1A;
  animation: psc-spin 0.7s linear infinite; margin: 0 auto 16px;
}
@keyframes psc-spin { to { transform: rotate(360deg); } }
.psc-loading-text { font-size: 14px; color: #4A4A4A; }
.psc-error-icon {
  width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 14px;
  background: #EFEFEF; display: flex; align-items: center; justify-content: center;
  color: #4A4A4A;
}
.psc-error h2 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #1A1A1A; }
.psc-error p { margin: 0; font-size: 14px; color: #4A4A4A; }

/* ---- Print styles ---- */
@media print {
  .psc-root { background: #FFFFFF; padding: 0; }
  .psc-toolbar { display: none !important; }
  .psc-table-card { border: 1px solid #DADADA; break-inside: avoid; page-break-inside: avoid; }
  .psc-table-header { background: #F8F8F8; }
  .psc-container { max-width: 100%; }
  @page { margin: 1.5cm; }
}
`;

function formatPscDate(dateStr: string | null): string {
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

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const eid = eventId ?? '';

  const { data: event, isLoading: eventLoading } = useEvent(eid || undefined);
  const { data: tables = [], isLoading: tablesLoading } = useTables(eid || undefined);
  const { data: guests = [], isLoading: guestsLoading } = useGuests(eid || undefined);

  const isLoading = eventLoading || tablesLoading || guestsLoading;

  // Group guests by table_id
  const guestsByTable = new Map<string, GuestWithTable[]>();
  const unassigned: GuestWithTable[] = [];
  for (const g of guests) {
    if (g.table_id) {
      const arr = guestsByTable.get(g.table_id) ?? [];
      arr.push(g);
      guestsByTable.set(g.table_id, arr);
    } else {
      unassigned.push(g);
    }
  }

  return (
    <div className="psc-root">
      <style>{PSC_CSS}</style>
      <div className="psc-container">
        {/* Toolbar */}
        <div className="psc-toolbar">
          <div className="psc-toolbar-left">
            <Link to={`/e/${eid}`} className="psc-back-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Event
            </Link>
          </div>
          <button className="psc-print-btn" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6V2h8v4M4 11H2V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h-2M4 9h8v5H4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Print Seating Chart
          </button>
        </div>

        {isLoading ? (
          <div className="psc-loading">
            <div className="psc-loading-dot" />
            <p className="psc-loading-text">Loading seating chart...</p>
          </div>
        ) : !event ? (
          <div className="psc-error">
            <div className="psc-error-icon">
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
            <div className="psc-header">
              <h1>Seating Chart — {event.name}</h1>
              <p className="psc-header-meta">
                {event.date && <span>{formatPscDate(event.date)}</span>}
                {event.venue && <span>{event.venue}</span>}
                <span>{tables.length} tables · {guests.length} guests</span>
              </p>
            </div>

            {/* Tables */}
            <div className="psc-tables">
              {tables.map((table: Table) => {
                const tableGuests = guestsByTable.get(table.id) ?? [];
                return (
                  <div key={table.id} className="psc-table-card">
                    <div className="psc-table-header">
                      <div className="psc-table-name">
                        <span className="psc-table-number">{table.number}</span>
                        {table.name || `Table ${table.number}`}
                      </div>
                      <span className="psc-table-capacity">
                        {tableGuests.length} / {table.capacity} seated
                      </span>
                    </div>
                    {tableGuests.length === 0 ? (
                      <div className="psc-guest-empty">No guests assigned</div>
                    ) : (
                      <ul className="psc-guest-list">
                        {tableGuests.map((g: GuestWithTable) => (
                          <li key={g.id} className="psc-guest-item">
                            <span className="psc-guest-name">{g.name}</span>
                            <span className="psc-guest-party">
                              {g.party_size} {g.party_size === 1 ? 'guest' : 'guests'}
                            </span>
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
                <h2 className="psc-unassigned-title">
                  Unassigned ({unassigned.length})
                </h2>
                <div className="psc-tables">
                  <div className="psc-table-card">
                    <ul className="psc-guest-list">
                      {unassigned.map((g: GuestWithTable) => (
                        <li key={g.id} className="psc-guest-item">
                          <span className="psc-guest-name">{g.name}</span>
                          <span className="psc-guest-party">
                            {g.party_size} {g.party_size === 1 ? 'guest' : 'guests'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
