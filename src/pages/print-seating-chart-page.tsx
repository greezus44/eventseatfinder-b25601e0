import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

const PSC_CSS = `
.psc-root { min-height: 100vh; background: #FFFFFF; font-family: 'Inter', sans-serif; padding: 32px; }
.psc-container { max-width: 900px; margin: 0 auto; }
.psc-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
.psc-header-left { flex: 1; min-width: 200px; }
.psc-back-btn { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px; border: 1px solid #DADADA; border-radius: 10px; background: #FFFFFF; color: #4A4A4A; font-size: 13px; font-weight: 500; text-decoration: none; cursor: pointer; transition: all 200ms ease; }
.psc-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.psc-print-btn { display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px; border: none; border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 200ms ease; }
.psc-print-btn:hover { background: #333333; }

.psc-title { font-size: 28px; font-weight: 700; color: #1A1A1A; margin: 16px 0 4px; }
.psc-subtitle { font-size: 14px; color: #4A4A4A; margin-bottom: 4px; }
.psc-venue { font-size: 14px; color: #B0B0B0; }

.psc-summary { display: flex; gap: 24px; margin-bottom: 32px; padding: 16px 20px; background: #F8F8F8; border: 1px solid #EFEFEF; border-radius: 12px; }
.psc-summary-item { display: flex; flex-direction: column; gap: 2px; }
.psc-summary-label { font-size: 11px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; }
.psc-summary-value { font-size: 18px; font-weight: 700; color: #1A1A1A; }

.psc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.psc-table-card { border: 1px solid #EFEFEF; border-radius: 12px; padding: 20px; background: #FFFFFF; }
.psc-table-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #EFEFEF; }
.psc-table-num { font-size: 20px; font-weight: 700; color: #1A1A1A; }
.psc-table-name { font-size: 13px; color: #4A4A4A; }
.psc-table-cap { font-size: 12px; color: #B0B0B0; padding: 4px 10px; background: #F8F8F8; border-radius: 6px; }
.psc-guest-list { list-style: none; margin: 0; padding: 0; }
.psc-guest-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #F8F8F8; }
.psc-guest-item:last-child { border-bottom: none; }
.psc-guest-dot { width: 6px; height: 6px; border-radius: 50%; background: #DADADA; flex-shrink: 0; }
.psc-guest-name { flex: 1; }
.psc-guest-party { font-size: 12px; color: #B0B0B0; }
.psc-guest-empty { font-size: 13px; color: #B0B0B0; font-style: italic; padding: 8px 0; }

.psc-unassigned { margin-top: 24px; }
.psc-unassigned-title { font-size: 16px; font-weight: 600; color: #1A1A1A; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #EFEFEF; }
.psc-unassigned-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.psc-unassigned-item { padding: 10px 14px; background: #F8F8F8; border: 1px solid #EFEFEF; border-radius: 8px; font-size: 14px; color: #1A1A1A; display: flex; align-items: center; justify-content: space-between; }

.psc-loading { display: flex; align-items: center; justify-content: center; min-height: 400px; }
.psc-spinner { width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A; border-radius: 50%; animation: psc-spin 0.8s linear infinite; }
@keyframes psc-spin { to { transform: rotate(360deg); } }

.psc-empty { text-align: center; padding: 64px 32px; color: #B0B0B0; font-size: 14px; }

@media print {
  .psc-root { padding: 0; }
  .psc-header { display: block; }
  .psc-back-btn, .psc-print-btn { display: none !important; }
  .psc-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .psc-table-card { break-inside: avoid; border: 1px solid #DADADA; }
  .psc-summary { background: #FFFFFF; border: 1px solid #DADADA; }
}

@media (max-width: 640px) { .psc-root { padding: 16px; } .psc-grid { grid-template-columns: 1fr; } .psc-summary { flex-wrap: wrap; gap: 12px; } }
`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');

  const loading = eventLoading || tablesLoading;

  if (loading) {
    return (
      <div className="psc-root">
        <style>{PSC_CSS}</style>
        <div className="psc-loading">
          <div className="psc-spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="psc-root">
        <style>{PSC_CSS}</style>
        <div className="psc-container">
          <div className="psc-empty">
            Event not found. <Link to="/" style={{ color: '#1A1A1A', fontWeight: 500 }}>Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const guestsByTable = (tables ?? []).map((table) => ({
    table,
    guests: (guests ?? []).filter((g) => g.table_id === table.id),
  }));

  const unassignedGuests = (guests ?? []).filter((g) => !g.table_id);
  const totalGuests = guests?.length ?? 0;
  const assignedCount = totalGuests - unassignedGuests.length;

  return (
    <div className="psc-root">
      <style>{PSC_CSS}</style>
      <div className="psc-container">
        <div className="psc-header">
          <div className="psc-header-left">
            <Link to={`/events/${eventId}`} className="psc-back-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to Event
            </Link>
            <h1 className="psc-title">{event.name}</h1>
            <div className="psc-subtitle">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</div>
            {event.venue && <div className="psc-venue">{event.venue}</div>}
          </div>
          <button className="psc-print-btn" onClick={() => window.print()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="8" height="9" rx="1" /><path d="M3 8h2M13 8h2M3 8v6a1 1 0 001 1h10a1 1 0 001-1V8" strokeLinecap="round" /></svg>
            Print
          </button>
        </div>

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
            <div className="psc-summary-value">{assignedCount}</div>
          </div>
          <div className="psc-summary-item">
            <div className="psc-summary-label">Unassigned</div>
            <div className="psc-summary-value">{unassignedGuests.length}</div>
          </div>
        </div>

        {guestsByTable.length === 0 ? (
          <div className="psc-empty">No tables have been created for this event yet.</div>
        ) : (
          <div className="psc-grid">
            {guestsByTable.map(({ table, guests: tableGuests }) => (
              <div key={table.id} className="psc-table-card">
                <div className="psc-table-header">
                  <div>
                    <div className="psc-table-num">Table {table.number}</div>
                    {table.name && table.name !== `Table ${table.number}` && (
                      <div className="psc-table-name">{table.name}</div>
                    )}
                  </div>
                  <div className="psc-table-cap">{tableGuests.length} / {table.capacity}</div>
                </div>
                {tableGuests.length > 0 ? (
                  <ul className="psc-guest-list">
                    {tableGuests.map((g) => (
                      <li key={g.id} className="psc-guest-item">
                        <span className="psc-guest-dot" />
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
            ))}
          </div>
        )}

        {unassignedGuests.length > 0 && (
          <div className="psc-unassigned">
            <div className="psc-unassigned-title">Unassigned Guests ({unassignedGuests.length})</div>
            <ul className="psc-unassigned-list">
              {unassignedGuests.map((g) => (
                <li key={g.id} className="psc-unassigned-item">
                  <span>{g.name}</span>
                  {g.party_size > 1 && <span className="psc-guest-party">Party of {g.party_size}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
