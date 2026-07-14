import { useNavigate } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';
import { useEffect } from 'react';

export function PrintGuestListPage() {
  const eventId = window.location.pathname.split('/')[2];
  const { data: event } = useEvent(eventId);
  const { data: guests } = useGuests(eventId);
  const navigate = useNavigate();

  useEffect(() => {
    window.print();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Georgia, serif' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>{event?.name || 'Event'}</h1>
        <p style={{ fontSize: '16px', color: '#666' }}>Guest List</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1A1A1A' }}>
            <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px' }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px', fontSize: '14px' }}>Name</th>
          </tr>
        </thead>
        <tbody>
          {guests?.map((g, i) => (
            <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px', fontSize: '14px' }}>{i + 1}</td>
              <td style={{ padding: '8px', fontSize: '14px' }}>{g.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
