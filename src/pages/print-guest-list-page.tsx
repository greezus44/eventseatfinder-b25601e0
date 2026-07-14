import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event } = useEvent(eventId ?? '');
  const { data: guests, isLoading: guestsLoading } = useGuests(eventId ?? '');
  const { data: tables } = useTables(eventId ?? '');

  const tableNameMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const t of tables ?? []) m.set(t.id, t.name);
    return m;
  }, [tables]);

  return (
    <div className="print-page">
      <div className="print-header">
        <h1 className="print-title">{event?.name ?? 'Event'}</h1>
        <p className="print-subtitle">Guest List</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to={`/events/${eventId}`} className="btn btn-secondary btn-sm">
          ← Back to Editor
        </Link>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          Print
        </button>
      </div>

      {guestsLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p className="loading-text">Loading…</p>
        </div>
      ) : !guests || guests.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No guests</p>
          <p>Add guests to see the guest list.</p>
        </div>
      ) : (
        <div className="print-table-card">
          <div className="print-table-name">
            Guest List ({guests.length} guests)
          </div>
          {guests.map((g, i) => (
            <div key={g.id} className="print-guest-row">
              <span>
                {g.name}
                {g.table_id && (
                  <span style={{ color: 'var(--gray-500)', marginLeft: 8 }}>
                    · {tableNameMap.get(g.table_id) ?? 'Unknown table'}
                  </span>
                )}
              </span>
              <span className="print-guest-number">#{i + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
