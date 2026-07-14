import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';

export function PrintSeatingChartPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event } = useEvent(eventId);
  const { data: guests } = useGuests(eventId);
  const { data: tables } = useTables(eventId);

  useEffect(() => {
    window.print();
  }, []);

  const guestsByTable: Record<string, string[]> = {};
  (guests || []).forEach((g) => {
    if (g.table_id) {
      if (!guestsByTable[g.table_id]) guestsByTable[g.table_id] = [];
      guestsByTable[g.table_id].push(g.name);
    }
  });

  return React.createElement(
    'div',
    { className: 'print-content print-page', style: { padding: '40px', maxWidth: '900px', margin: '0 auto' } },
    React.createElement('h1', { style: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' } }, event?.name || 'Event'),
    React.createElement('p', { className: 'text-muted', style: { marginBottom: '32px' } }, 'Seating Chart'),
    (tables || []).length === 0
      ? React.createElement('p', { className: 'text-muted' }, 'No tables assigned.')
      : React.createElement(
          'div',
          { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' } },
          (tables || []).map((table) =>
            React.createElement(
              'div',
              { key: table.id, className: 'card', style: { padding: '16px' } },
              React.createElement(
                'h3',
                { style: { fontSize: '16px', fontWeight: 600, marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #EFEFEF' } },
                `${table.name} (Table ${table.number})`,
              ),
              React.createElement(
                'ul',
                { style: { listStyle: 'none', padding: 0 } },
                (guestsByTable[table.id] || []).map((name, idx) =>
                  React.createElement('li', { key: idx, style: { padding: '4px 0', fontSize: '13px' } }, name),
                ),
              ),
              (guestsByTable[table.id] || []).length === 0
                ? React.createElement('p', { className: 'ee-muted', style: { fontSize: '12px' } }, 'No guests assigned')
                : null,
            ),
          ),
        ),
  );
}
