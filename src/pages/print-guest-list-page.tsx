import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

const PGL_CSS = `
.pgl-root { min-height: 100vh; background: #FFFFFF; font-family: 'Inter', sans-serif; padding: 32px; }
.pgl-container { max-width: 800px; margin: 0 auto; }
.pgl-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
.pgl-header-left { flex: 1; min-width: 200px; }
.pgl-back-btn { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px; border: 1px solid #DADADA; border-radius: 10px; background: #FFFFFF; color: #4A4A4A; font-size: 13px; font-weight: 500; text-decoration: none; cursor: pointer; transition: all 200ms ease; }
.pgl-back-btn:hover { background: #EFEFEF; color: #1A1A1A; }
.pgl-print-btn { display: inline-flex; align-items: center; gap: 6px; height: 44px; padding: 0 20px; border: none; border-radius: 12px; background: #1A1A1A; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 200ms ease; }
.pgl-print-btn:hover { background: #333333; }

.pgl-title { font-size: 28px; font-weight: 700; color: #1A1A1A; margin: 16px 0 4px; }
.pgl-subtitle { font-size: 14px; color: #4A4A4A; margin-bottom: 4px; }
.pgl-venue { font-size: 14px; color: #B0B0B0; }

.pgl-summary { display: flex; gap: 24px; margin-bottom: 32px; padding: 16px 20px; background: #F8F8F8; border: 1px solid #EFEFEF; border-radius: 12px; }
.pgl-summary-item { display: flex; flex-direction: column; gap: 2px; }
.pgl-summary-label { font-size: 11px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; }
.pgl-summary-value { font-size: 18px; font-weight: 700; color: #1A1A1A; }

.pgl-table { width: 100%; border-collapse: collapse; }
.pgl-table th { text-align: left; padding: 12px 14px; font-size: 12px; font-weight: 600; color: #B0B0B0; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #EFEFEF; }
.pgl-table td { padding: 14px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #F8F8F8; }
.pgl-table tr:hover { background: #FAFAFA; }
.pgl-table-num { width: 50px; text-align: center; font-weight: 600; color: #4A4A4A; }
.pgl-table-name { font-weight: 500; }
.pgl-table-assignment { color: #4A4A4A; }
.pgl-table-assignment--none { color: #B0B0B0; font-style: italic; }
.pgl-table-party { color: #B0B0B0; font-size: 13px; }

.pgl-loading { display: flex; align-items: center; justify-content: center; min-height: 400px; }
.pgl-spinner { width: 32px; height: 32px; border: 3px solid #EFEFEF; border-top-color: #1A1A1A; border-radius: 50%; animation: pgl-spin 0.8s linear infinite; }
@keyframes pgl-spin { to { transform: rotate(360deg); } }

.pgl-empty { text-align: center; padding: 64px 32px; color: #B0B0B0; font-size: 14px; }

@media print {
  .pgl-root { padding: 0; }
  .pgl-header { display: block; }
  .pgl-back-btn, .pgl-print-btn { display: none !important; }
  .pgl-summary { background: #FFFFFF; border: 1px solid #DADADA; }
  .pgl-table th, .pgl-table td { font-size: 12px; }
}

@media (max-width: 640px) { .pgl-root { padding: 16px; } .pgl-summary { flex-wrap: wrap; gap: 12px; } .pgl-table { font-size: 12px; } .pgl-table th, .pgl-table td { padding: 8px 6px; } }
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

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');

  const loading = eventLoading || guestsLoading;

  if (loading) {
    return (
      <div className="pgl-root">
        <style>{PGL_CSS}</style>
        <div className="pgl-loading">
          <div className="pgl-spinner" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pgl-root">
        <style>{PGL_CSS}</style>
        <div className="pgl-container">
          <div className="pgl-empty">
            Event not found. <Link to="/" style={{ color: '#1A1A1A', fontWeight: 500 }}>Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const guestList = guests ?? [];
  const assignedCount = guestList.filter((g) => g.table_id).length;
  const unassignedCount = guestList.length - assignedCount;

  // Sort: assigned guests first (by table number), then unassigned
  const sortedGuests = [...guestList].sort((a, b) => {
    if (a.table_id && !b.table_id) return -1;
    if (!a.table_id && b.table_id) return 1;
    if (a.table && b.table) {
      return a.table.number.localeCompare(b.table.number, undefined, { numeric: true });
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="pgl-root">
      <style>{PGL_CSS}</style>
      <div className="pgl-container">
        <div className="pgl-header">
          <div className="pgl-header-left">
            <Link to={`/events/${eventId}`} className="pgl-back-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to Event
            </Link>
            <h1 className="pgl-title">{event.name}</h1>
            <div className="pgl-subtitle">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</div>
            {event.venue && <div className="pgl-venue">{event.venue}</div>}
          </div>
          <button className="pgl-print-btn" onClick={() => window.print()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="8" height="9" rx="1" /><path d="M3 8h2M13 8h2M3 8v6a1 1 0 001 1h10a1 1 0 001-1V8" strokeLinecap="round" /></svg>
            Print
          </button>
        </div>

        <div className="pgl-summary">
          <div className="pgl-summary-item">
            <div className="pgl-summary-label">Total Guests</div>
            <div className="pgl-summary-value">{guestList.length}</div>
          </div>
          <div className="pgl-summary-item">
            <div className="pgl-summary-label">Assigned</div>
            <div className="pgl-summary-value">{assignedCount}</div>
          </div>
          <div className="pgl-summary-item">
            <div className="pgl-summary-label">Unassigned</div>
            <div className="pgl-summary-value">{unassignedCount}</div>
          </div>
        </div>

        {sortedGuests.length === 0 ? (
          <div className="pgl-empty">No guests have been added to this event yet.</div>
        ) : (
          <table className="pgl-table">
            <thead>
              <tr>
                <th className="pgl-table-num">#</th>
                <th>Guest Name</th>
                <th>Table Assignment</th>
                <th>Party Size</th>
              </tr>
            </thead>
            <tbody>
              {sortedGuests.map((guest, index) => (
                <tr key={guest.id}>
                  <td className="pgl-table-num">{index + 1}</td>
                  <td className="pgl-table-name">{guest.name}</td>
                  <td>
                    {guest.table ? (
                      <span className="pgl-table-assignment">Table {guest.table.number}{guest.table.name && guest.table.name !== `Table ${guest.table.number}` ? ` — ${guest.table.name}` : ''}</span>
                    ) : (
                      <span className="pgl-table-assignment pgl-table-assignment--none">Unassigned</span>
                    )}
                  </td>
                  <td className="pgl-table-party">{guest.party_size > 1 ? `Party of ${guest.party_size}` : '1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
