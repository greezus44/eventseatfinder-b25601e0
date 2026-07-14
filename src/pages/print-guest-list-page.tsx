import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

const PGL_CSS = `
.pgl-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1A1A1A;
  background: #FFFFFF;
  min-height: 100vh;
  padding: 32px 40px;
}
.pgl-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.pgl-back {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: #4A4A4A;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  border: 1px solid #D5D5D5;
  border-radius: 8px;
  transition: background 0.2s ease;
}
.pgl-back:hover { background: #F8F8F8; color: #1A1A1A; }
.pgl-print-btn {
  padding: 9px 20px;
  background: #1A1A1A;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.pgl-print-btn:hover { background: #2A2A2A; }
.pgl-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid #1A1A1A;
}
.pgl-event-name {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}
.pgl-event-meta {
  font-size: 15px;
  color: #4A4A4A;
  margin: 0;
}
.pgl-summary {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}
.pgl-summary-item {
  text-align: center;
}
.pgl-summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin: 0;
  letter-spacing: -0.02em;
}
.pgl-summary-label {
  font-size: 13px;
  color: #8A8A8A;
  margin: 4px 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pgl-table {
  width: 100%;
  border-collapse: collapse;
}
.pgl-table thead th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #8A8A8A;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 2px solid #1A1A1A;
}
.pgl-table tbody td {
  padding: 12px 16px;
  font-size: 14px;
  color: #1A1A1A;
  border-bottom: 1px solid #F0F0F0;
}
.pgl-table tbody tr:last-child td {
  border-bottom: none;
}
.pgl-table-num {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: #4A4A4A;
}
.pgl-table-name {
  font-weight: 500;
}
.pgl-table-assign {
  color: #4A4A4A;
}
.pgl-table-assign--none {
  color: #8A8A8A;
  font-style: italic;
}
.pgl-loading {
  text-align: center;
  padding: 80px 24px;
  color: #8A8A8A;
  font-size: 16px;
}
.pgl-not-found {
  text-align: center;
  padding: 80px 24px;
}
.pgl-not-found-title {
  font-size: 24px;
  font-weight: 600;
  color: #4A4A4A;
  margin: 0 0 8px 0;
}
.pgl-not-found-text {
  font-size: 15px;
  color: #8A8A8A;
  margin: 0;
}
.pgl-empty {
  text-align: center;
  padding: 48px 24px;
  color: #8A8A8A;
  font-size: 15px;
}

@media print {
  .pgl-toolbar { display: none; }
  .pgl-root { padding: 0; }
  .pgl-table tbody tr { break-inside: avoid; }
}
`;

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';
  const { data: event, isLoading } = useEvent(id);
  const { data: guests } = useGuests(id);

  if (isLoading) {
    return (
      <>
        <style>{PGL_CSS}</style>
        <div className="pgl-root">
          <div className="pgl-loading">Loading…</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{PGL_CSS}</style>
        <div className="pgl-root">
          <div className="pgl-not-found">
            <p className="pgl-not-found-title">Event Not Found</p>
            <p className="pgl-not-found-text">The event you're looking for doesn't exist.</p>
          </div>
        </div>
      </>
    );
  }

  const sortedGuests = [...(guests ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const assigned = sortedGuests.filter((g) => g.table);
  const unassigned = sortedGuests.filter((g) => !g.table);

  return (
    <>
      <style>{PGL_CSS}</style>
      <div className="pgl-root">
        <div className="pgl-toolbar">
          <Link className="pgl-back" to={`/events/${event.id}`}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Event
          </Link>
          <button className="pgl-print-btn" onClick={() => window.print()}>Print Guest List</button>
        </div>

        <div className="pgl-header">
          <h1 className="pgl-event-name">{event.name}</h1>
          <p className="pgl-event-meta">
            {event.date && formatDate(event.date)}
            {event.time && ` · ${formatTime(event.time)}`}
            {event.venue && ` · ${event.venue}`}
          </p>
        </div>

        <div className="pgl-summary">
          <div className="pgl-summary-item">
            <p className="pgl-summary-value">{sortedGuests.length}</p>
            <p className="pgl-summary-label">Total Guests</p>
          </div>
          <div className="pgl-summary-item">
            <p className="pgl-summary-value">{assigned.length}</p>
            <p className="pgl-summary-label">Seated</p>
          </div>
          <div className="pgl-summary-item">
            <p className="pgl-summary-value">{unassigned.length}</p>
            <p className="pgl-summary-label">Unassigned</p>
          </div>
        </div>

        {sortedGuests.length === 0 ? (
          <div className="pgl-empty">No guests to display.</div>
        ) : (
          <table className="pgl-table">
            <thead>
              <tr>
                <th className="pgl-table-num">#</th>
                <th>Guest Name</th>
                <th>Table Assignment</th>
              </tr>
            </thead>
            <tbody>
              {sortedGuests.map((g, i) => (
                <tr key={g.id}>
                  <td className="pgl-table-num">{i + 1}</td>
                  <td className="pgl-table-name">{g.name}</td>
                  <td className={g.table ? 'pgl-table-assign' : 'pgl-table-assign pgl-table-assign--none'}>
                    {g.table
                      ? `Table ${g.table.number}${g.table.name !== String(g.table.number) ? ` — ${g.table.name}` : ''}`
                      : 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
