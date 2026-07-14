import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEvent } from '@/hooks/use-events';
import { useGuests } from '@/hooks/use-guests';

export function PrintGuestListPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event } = useEvent(eventId);
  const { data: guests } = useGuests(eventId);

  useEffect(() => {
    window.print();
  }, []);

  return React.createElement(
    'div',
    { className: 'print-content print-page', style: { padding: '40px', maxWidth: '800px', margin: '0 auto' } },
    React.createElement('h1', { style: { fontSize: '28px', fontWeight: 700, marginBottom: '8px' } }, event?.name || 'Event'),
    React.createElement('p', { className: 'text-muted', style: { marginBottom: '32px' } }, `Guest List (${guests?.length || 0} guests)`),
    (guests || []).length === 0
      ? React.createElement('p', { className: 'text-muted' }, 'No guests yet.')
      : React.createElement(
          'table',
          { className: 'ee-bulk-table' },
          React.createElement(
            'thead',
            null,
            React.createElement(
              'tr',
              null,
              React.createElement('th', null, '#'),
              React.createElement('th', null, 'Guest Name'),
            ),
          ),
          React.createElement(
            'tbody',
            null,
            (guests || []).map((guest, idx) =>
              React.createElement(
                'tr',
                { key: guest.id },
                React.createElement('td', null, idx + 1),
                React.createElement('td', null, guest.name),
              ),
            ),
          ),
        ),
  );
}
