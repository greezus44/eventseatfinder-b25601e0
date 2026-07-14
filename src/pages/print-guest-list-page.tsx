import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading: eventLoading } = useEvent(eventId ?? '');
  const { data: guests } = useGuests(eventId ?? '');

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

  const totalPartySize = guestList.reduce((sum, g) => sum + g.party_size, 0);
  const assignedCount = guestList.filter((g) => g.table_id).length;
  const unassignedCount = guestList.length - assignedCount;

  if (eventLoading) {
    return (
      <>
        <style>{PGL_CSS}</style>
        <div className="pgl-page">
          <div className="pgl-loading">
            <div className="pgl-spinner" />
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{PGL_CSS}</style>
        <div className="pgl-page">
          <div className="pgl-not-found">
            <p>Event not found.</p>
            <Link to="/" className="pgl-back-link">← Back to Dashboard</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PGL_CSS}</style>
      <div className="pgl-page">
        {/* Toolbar — hidden on print */}
        <div className="pgl-toolbar">
          <Link to={`/events/${event.id}`} className="pgl-back-link">← Back to Editor</Link>
          <button className="pgl-print-btn" onClick={() => window.print()}>
            Print
          </button>
        </div>

        {/* Header */}
        <header className="pgl-header">
          <h1 className="pgl-event-name">{event.name}</h1>
          {event.date && <p className="pgl-event-date">{formatDate(event.date)}</p>}
          {event.venue && <p className="pgl-event-venue">{event.venue}</p>}
          <div className="pgl-subtitle">Guest List</div>
        </header>

        {/* Summary */}
        <div className="pgl-summary">
          <div className="pgl-summary-item">
            <span className="pgl-summary-value">{guestList.length}</span>
            <span className="pgl-summary-label">Guests</span>
          </div>
          <div className="pgl-summary-item">
            <span className="pgl-summary-value">{totalPartySize}</span>
            <span className="pgl-summary-label">Total Party</span>
          </div>
          <div className="pgl-summary-item">
            <span className="pgl-summary-value">{assignedCount}</span>
            <span className="pgl-summary-label">Seated</span>
          </div>
          <div className="pgl-summary-item">
            <span className="pgl-summary-value">{unassignedCount}</span>
            <span className="pgl-summary-label">Unassigned</span>
          </div>
        </div>

        {/* Guest Table */}
        {guestList.length === 0 ? (
          <p className="pgl-empty">No guests have been added yet.</p>
        ) : (
          <div className="pgl-table-wrap">
            <table className="pgl-table">
              <thead>
                <tr>
                  <th className="pgl-th pgl-th--num">#</th>
                  <th className="pgl-th">Name</th>
                  <th className="pgl-th">Email</th>
                  <th className="pgl-th">Phone</th>
                  <th className="pgl-th pgl-th--party">Party</th>
                  <th className="pgl-th">Table</th>
                  <th className="pgl-th">Dietary Notes</th>
                </tr>
              </thead>
              <tbody>
                {guestList.map((guest, idx) => (
                  <tr key={guest.id} className="pgl-row">
                    <td className="pgl-td pgl-td--num">{idx + 1}</td>
                    <td className="pgl-td pgl-td--name">{guest.name}</td>
                    <td className="pgl-td">{guest.email ?? '—'}</td>
                    <td className="pgl-td">{guest.phone ?? '—'}</td>
                    <td className="pgl-td pgl-td--party">{guest.party_size}</td>
                    <td className="pgl-td pgl-td--table">
                      {guest.table ? (
                        <span className="pgl-table-badge">
                          {guest.table.name}
                        </span>
                      ) : (
                        <span className="pgl-unassigned-badge">—</span>
                      )}
                    </td>
                    <td className="pgl-td pgl-td--notes">{guest.dietary_notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <footer className="pgl-footer">
          <span>Generated by Seatly</span>
          <span>{new Date().toLocaleDateString('en-US')}</span>
        </footer>
      </div>
    </>
  );
}

const PGL_CSS = `
.pgl-page {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1A1A1A;
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px;
}

/* Toolbar */
.pgl-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.pgl-back-link {
  color: #4A4A4A;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.pgl-back-link:hover {
  color: #1A1A1A;
}

.pgl-print-btn {
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

.pgl-print-btn:hover {
  background: #4A4A4A;
}

/* Header */
.pgl-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #1A1A1A;
}

.pgl-event-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
}

.pgl-event-date {
  font-size: 15px;
  color: #4A4A4A;
  margin: 8px 0 0 0;
}

.pgl-event-venue {
  font-size: 15px;
  color: #4A4A4A;
  margin: 4px 0 0 0;
}

.pgl-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 12px;
}

/* Summary */
.pgl-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.pgl-summary-item {
  text-align: center;
  padding: 16px;
  border: 1px solid #EFEFEF;
  border-radius: 10px;
  background: #F8F8F8;
}

.pgl-summary-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1;
}

.pgl-summary-label {
  display: block;
  font-size: 12px;
  color: #4A4A4A;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Table */
.pgl-table-wrap {
  overflow-x: auto;
}

.pgl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.pgl-th {
  text-align: left;
  padding: 12px 14px;
  font-weight: 600;
  color: #FFFFFF;
  background: #1A1A1A;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.pgl-th--num {
  width: 40px;
  text-align: center;
}

.pgl-th--party {
  width: 60px;
  text-align: center;
}

.pgl-row {
  break-inside: avoid;
}

.pgl-row:nth-child(even) {
  background: #F8F8F8;
}

.pgl-td {
  padding: 10px 14px;
  border-bottom: 1px solid #EFEFEF;
  color: #1A1A1A;
  vertical-align: top;
}

.pgl-td--num {
  text-align: center;
  color: #4A4A4A;
  font-weight: 500;
}

.pgl-td--name {
  font-weight: 600;
}

.pgl-td--party {
  text-align: center;
}

.pgl-td--table {
  white-space: nowrap;
}

.pgl-td--notes {
  max-width: 200px;
  color: #4A4A4A;
  font-size: 13px;
}

.pgl-table-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  background: #1A1A1A;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
}

.pgl-unassigned-badge {
  color: #DADADA;
}

/* Empty */
.pgl-empty {
  text-align: center;
  color: #4A4A4A;
  font-size: 15px;
  padding: 48px;
}

/* Footer */
.pgl-footer {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid #EFEFEF;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #4A4A4A;
}

/* Loading */
.pgl-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.pgl-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #EFEFEF;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: pgl-spin 0.8s linear infinite;
}

@keyframes pgl-spin {
  to { transform: rotate(360deg); }
}

/* Not Found */
.pgl-not-found {
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
  .pgl-toolbar {
    display: none !important;
  }
  .pgl-page {
    max-width: none;
    padding: 0;
  }
  .pgl-row {
    break-inside: avoid;
  }
  .pgl-summary-item {
    background: #FFFFFF !important;
    border: 1px solid #DADADA !important;
  }
}
`;
