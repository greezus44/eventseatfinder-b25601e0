import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: tables } = useTables(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');

  const tableList = tables ?? [];
  const guestList = guests ?? [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const guestsForTable = (tableId: string) =>
    guestList.filter((g) => g.table_id === tableId);

  const unassignedGuests = guestList.filter((g) => !g.table_id);

  if (eventLoading) {
    return (
      <>
        <style>{PSC_CSS}</style>
        <div className="psc-page">
          <div className="psc-loading">
            <div className="psc-spinner" />
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{PSC_CSS}</style>
        <div className="psc-page">
          <div className="psc-not-found">
            <p>Event not found.</p>
            <Link to="/" className="psc-back-link">← Back to Dashboard</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PSC_CSS}</style>
      <div className="psc-page">
        {/* Toolbar — hidden on print */}
        <div className="psc-toolbar">
          <Link to={`/events/${event.id}`} className="psc-back-link">← Back to Editor</Link>
          <button className="psc-print-btn" onClick={() => window.print()}>
            Print
          </button>
        </div>

        {/* Header */}
        <header className="psc-header">
          <h1 className="psc-event-name">{event.name}</h1>
          {event.date && <p className="psc-event-date">{formatDate(event.date)}</p>}
          {event.venue && <p className="psc-event-venue">{event.venue}</p>}
          <div className="psc-subtitle">Seating Chart</div>
        </header>

        {/* Summary */}
        <div className="psc-summary">
          <div className="psc-summary-item">
            <span className="psc-summary-value">{tableList.length}</span>
            <span className="psc-summary-label">Tables</span>
          </div>
          <div className="psc-summary-item">
            <span className="psc-summary-value">{guestList.length}</span>
            <span className="psc-summary-label">Guests</span>
          </div>
          <div className="psc-summary-item">
            <span className="psc-summary-value">{guestList.filter((g) => g.table_id).length}</span>
            <span className="psc-summary-label">Seated</span>
          </div>
          <div className="psc-summary-item">
            <span className="psc-summary-value">{unassignedGuests.length}</span>
            <span className="psc-summary-label">Unassigned</span>
          </div>
        </div>

        {/* Tables Grid */}
        {tableList.length === 0 ? (
          <p className="psc-empty">No tables have been created yet.</p>
        ) : (
          <div className="psc-tables-grid">
            {tableList.map((table) => {
              const assigned = guestsForTable(table.id);
              return (
                <div key={table.id} className="psc-table-card">
                  <div className="psc-table-header">
                    <span className="psc-table-number">Table {table.number}</span>
                    {table.name !== String(table.number) && (
                      <span className="psc-table-name">{table.name}</span>
                    )}
                    <span className="psc-table-count">
                      {assigned.length}/{table.capacity}
                    </span>
                  </div>
                  <div className="psc-table-guests">
                    {assigned.length === 0 ? (
                      <span className="psc-no-guests">No guests assigned</span>
                    ) : (
                      <ul className="psc-guest-list">
                        {assigned.map((guest) => (
                          <li key={guest.id} className="psc-guest-item">
                            <span className="psc-guest-name">{guest.name}</span>
                            {guest.party_size > 1 && (
                              <span className="psc-guest-party">×{guest.party_size}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unassigned Guests */}
        {unassignedGuests.length > 0 && (
          <div className="psc-unassigned">
            <h2 className="psc-unassigned-title">Unassigned Guests ({unassignedGuests.length})</h2>
            <ul className="psc-guest-list psc-guest-list--inline">
              {unassignedGuests.map((guest) => (
                <li key={guest.id} className="psc-guest-item psc-guest-item--inline">
                  <span className="psc-guest-name">{guest.name}</span>
                  {guest.party_size > 1 && (
                    <span className="psc-guest-party">×{guest.party_size}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <footer className="psc-footer">
          <span>Generated by Seatly</span>
          <span>{new Date().toLocaleDateString('en-US')}</span>
        </footer>
      </div>
    </>
  );
}

const PSC_CSS = `
.psc-page {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1A1A1A;
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px;
}

/* Toolbar */
.psc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.psc-back-link {
  color: #4A4A4A;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.psc-back-link:hover {
  color: #1A1A1A;
}

.psc-print-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.psc-print-btn:hover {
  background: #4A4A4A;
}

/* Header */
.psc-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #1A1A1A;
}

.psc-event-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
}

.psc-event-date {
  font-size: 15px;
  color: #4A4A4A;
  margin: 8px 0 0 0;
}

.psc-event-venue {
  font-size: 15px;
  color: #4A4A4A;
  margin: 4px 0 0 0;
}

.psc-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 12px;
}

/* Summary */
.psc-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.psc-summary-item {
  text-align: center;
  padding: 16px;
  border: 1px solid #EFEFEF;
  border-radius: 10px;
  background: #F8F8F8;
}

.psc-summary-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1;
}

.psc-summary-label {
  display: block;
  font-size: 12px;
  color: #4A4A4A;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Tables Grid */
.psc-tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.psc-table-card {
  border: 1px solid #DADADA;
  border-radius: 10px;
  overflow: hidden;
  break-inside: avoid;
}

.psc-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #1A1A1A;
  color: #FFFFFF;
  gap: 8px;
}

.psc-table-number {
  font-size: 15px;
  font-weight: 700;
}

.psc-table-name {
  font-size: 13px;
  color: #DADADA;
  flex: 1;
  text-align: center;
}

.psc-table-count {
  font-size: 12px;
  color: #DADADA;
  white-space: nowrap;
}

.psc-table-guests {
  padding: 12px 16px;
  min-height: 48px;
}

.psc-guest-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.psc-guest-list--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.psc-guest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #EFEFEF;
  font-size: 14px;
}

.psc-guest-item:last-child {
  border-bottom: none;
}

.psc-guest-item--inline {
  border: 1px solid #EFEFEF;
  border-radius: 6px;
  padding: 4px 10px;
  background: #F8F8F8;
}

.psc-guest-name {
  color: #1A1A1A;
  font-weight: 500;
}

.psc-guest-party {
  color: #4A4A4A;
  font-size: 12px;
}

.psc-no-guests {
  color: #4A4A4A;
  font-size: 13px;
  font-style: italic;
}

/* Unassigned */
.psc-unassigned {
  margin-top: 32px;
  padding: 20px;
  border: 1px dashed #DADADA;
  border-radius: 10px;
  background: #F8F8F8;
}

.psc-unassigned-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #1A1A1A;
}

/* Empty */
.psc-empty {
  text-align: center;
  color: #4A4A4A;
  font-size: 15px;
  padding: 48px;
}

/* Footer */
.psc-footer {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid #EFEFEF;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4A4A4A;
}

/* Loading */
.psc-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.psc-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #EFEFEF;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: psc-spin 0.8s linear infinite;
}

@keyframes psc-spin {
  to { transform: rotate(360deg); }
}

/* Not Found */
.psc-not-found {
  text-align: center;
  padding: 64px;
  font-size: 16px;
  color: #4A4A4A;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* Print Styles */
@media print {
  .psc-toolbar {
    display: none !important;
  }
  .psc-page {
    max-width: none;
    padding: 0;
  }
  .psc-table-card {
    break-inside: avoid;
  }
  .psc-summary-item {
    background: #FFFFFF !important;
    border: 1px solid #DADADA !important;
  }
}
`;
