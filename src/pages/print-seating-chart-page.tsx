import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useTables } from '@/hooks/use-tables';
import { useGuests } from '@/hooks/use-guests';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event } = useEvent(eventId ?? '');
  const { data: tables, isLoading: tablesLoading } = useTables(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');

  const guestsByTable = React.useMemo(() => {
    const m = new Map<string | null, typeof guests>();
    for (const g of guests ?? []) {
      const list = m.get(g.table_id) ?? [];
      list.push(g);
      m.set(g.table_id, list);
    }
    return m;
  }, [guests]);

  return (
    <div className="print-page">
      <div className="print-header">
        <h1 className="print-title">{event?.name ?? 'Event'}</h1>
        {event?.date && (
          <p className="print-subtitle">
            {event.date}
            {event.time ? ` at ${event.time}` : ''}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to={`/events/${eventId}`} className="btn btn-secondary btn-sm">
          ← Back to Editor
        </Link>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {tablesLoading || guestsLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="loading-text">Loading…</p>
        </div>
      ) : !tables || tables.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No tables</p>
          <p>Add tables to see the seating chart.</p>
        </div>
      ) : (
        <div>
          {tables.map((table) => {
            const tableGuests = guestsByTable.get(table.id) ?? [];
            return (
              <div key={table.id} className="print-table-card">
                <div className="print-table-name">
                  {table.name} ({tableGuests.length}/{table.capacity})
                </div>
                {tableGuests.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
                    No guests assigned
                  </p>
                ) : (
                  tableGuests.map((g, i) => (
                    <div key={g.id} className="print-guest-row">
                      <span>{g.name}</span>
                      <span className="print-guest-number">#{i + 1}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
