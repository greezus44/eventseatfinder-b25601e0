import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

const PSC_CSS = `
.psc-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1A1A1A;
  background: #FFFFFF;
  min-height: 100vh;
  padding: 32px 40px;
}
.psc-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.psc-back {
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
.psc-back:hover { background: #F8F8F8; color: #1A1A1A; }
.psc-print-btn {
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
.psc-print-btn:hover { background: #2A2A2A; }
.psc-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 2px solid #1A1A1A;
}
.psc-event-name {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}
.psc-event-meta {
  font-size: 15px;
  color: #4A4A4A;
  margin: 0;
}
.psc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.psc-table-card {
  border: 1px solid #D5D5D5;
  border-radius: 12px;
  padding: 20px 24px;
  page-break-inside: avoid;
}
.psc-table-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E5E5;
}
.psc-table-num {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #1A1A1A;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
.psc-table-name {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}
.psc-table-cap {
  font-size: 13px;
  color: #8A8A8A;
  margin: 2px 0 0 0;
}
.psc-guest-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.psc-guest-item {
  padding: 8px 0;
  font-size: 14px;
  color: #1A1A1A;
  border-bottom: 1px solid #F0F0F0;
}
.psc-guest-item:last-child { border-bottom: none; }
.psc-guest-empty {
  font-size: 14px;
  color: #8A8A8A;
  font-style: italic;
  padding: 8px 0;
}
.psc-loading {
  text-align: center;
  padding: 80px 24px;
  color: #8A8A8A;
  font-size: 16px;
}
.psc-not-found {
  text-align: center;
  padding: 80px 24px;
}
.psc-not-found-title {
  font-size: 24px;
  font-weight: 600;
  color: #4A4A4A;
  margin: 0 0 8px 0;
}
.psc-not-found-text {
  font-size: 15px;
  color: #8A8A8A;
  margin: 0;
}

@media print {
  .psc-toolbar { display: none; }
  .psc-root { padding: 0; }
  .psc-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .psc-table-card { break-inside: avoid; }
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

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const id = eventId ?? '';
  const { data: event, isLoading } = useEvent(id);
  const { data: tables } = useTables(id);
  const { data: guests } = useGuests(id);

  if (isLoading) {
    return (
      <>
        <style>{PSC_CSS}</style>
        <div className="psc-root">
          <div className="psc-loading">Loading…</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{PSC_CSS}</style>
        <div className="psc-root">
          <div className="psc-not-found">
            <p className="psc-not-found-title">Event Not Found</p>
            <p className="psc-not-found-text">The event you're looking for doesn't exist.</p>
          </div>
        </div>
      </>
    );
  }

  const guestsByTable = (tables ?? []).map((table) => ({
    table,
    tableGuests: (guests ?? []).filter((g) => g.table_id === table.id),
  }));

  const unassigned = (guests ?? []).filter((g) => !g.table_id);

  return (
    <>
      <style>{PSC_CSS}</style>
      <div className="psc-root">
        <div className="psc-toolbar">
          <Link className="psc-back" to={`/events/${event.id}`}>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Event
          </Link>
          <button className="psc-print-btn" onClick={() => window.print()}>Print Seating Chart</button>
        </div>

        <div className="psc-header">
          <h1 className="psc-event-name">{event.name}</h1>
          <p className="psc-event-meta">
            {event.date && formatDate(event.date)}
            {event.time && ` · ${formatTime(event.time)}`}
            {event.venue && ` · ${event.venue}`}
          </p>
        </div>

        {guestsByTable.length === 0 && unassigned.length === 0 ? (
          <div className="psc-loading">No tables or guests to display.</div>
        ) : (
          <>
            <div className="psc-grid">
              {guestsByTable.map(({ table, tableGuests }) => (
                <div key={table.id} className="psc-table-card">
                  <div className="psc-table-header">
                    <div className="psc-table-num">{table.number}</div>
                    <div>
                      <p className="psc-table-name">{table.name}</p>
                      <p className="psc-table-cap">Capacity {table.capacity} · {tableGuests.length} seated</p>
                    </div>
                  </div>
                  {tableGuests.length === 0 ? (
                    <p className="psc-guest-empty">No guests assigned</p>
                  ) : (
                    <ul className="psc-guest-list">
                      {tableGuests.map((g, i) => (
                        <li key={g.id} className="psc-guest-item">
                          {i + 1}. {g.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {unassigned.length > 0 && (
              <div className="psc-table-card" style={{ marginTop: 24, borderColor: '#D5D5D5' }}>
                <div className="psc-table-header">
                  <div className="psc-table-num">?</div>
                  <div>
                    <p className="psc-table-name">Unassigned Guests</p>
                    <p className="psc-table-cap">{unassigned.length} guest{unassigned.length !== 1 ? 's' : ''} without a table</p>
                  </div>
                </div>
                <ul className="psc-guest-list">
                  {unassigned.map((g, i) => (
                    <li key={g.id} className="psc-guest-item">
                      {i + 1}. {g.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
