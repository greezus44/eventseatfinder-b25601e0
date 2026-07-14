import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useTables } from '@/hooks/use-tables';
import { useEffect } from 'react';

export function PrintSeatingChartPage() {
  const eventId = window.location.pathname.split('/')[2];
  const { data: event } = useEvent(eventId);
  const { data: tables } = useTables(eventId);
  const { data: guests } = useGuests(eventId);
  const navigate = useNavigate();

  useEffect(() => {
    window.print();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Georgia, serif' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>{event?.name || 'Event'}</h1>
        {event?.venue && <p style={{ fontSize: '16px', color: '#666' }}>{event.venue}</p>}
        {event?.date && <p style={{ fontSize: '14px', color: '#999' }}>{new Date(event.date).toLocaleDateString()}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {tables?.map((table) => {
          const tableGuests = guests?.filter((g) => g.table_id === table.id) || [];
          return (
            <div key={table.id} style={{ border: '2px solid #1A1A1A', borderRadius: '8px', padding: '16px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>
                Table {table.number} — {table.name}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {tableGuests.map((g, i) => (
                  <li key={g.id} style={{ fontSize: '14px', padding: '4px 0', borderBottom: '1px dotted #ddd' }}>
                    {i + 1}. {g.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate(`/events/${eventId}`)}
        style={{
          marginTop: '32px',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #DADADA',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        Back to Event
      </button>
    </div>
  );
}
