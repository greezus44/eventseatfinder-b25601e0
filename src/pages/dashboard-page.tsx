import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import type { EventInput } from '@/types';

export function DashboardPage() {
  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const toast = useToast();
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirmDialog();
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState<EventInput>({ name: '', slug: '' });

  const handleCreate = async () => {
    if (!newEvent.name || !newEvent.slug) {
      toast('Please fill in all fields', 'error');
      return;
    }
    const slug = newEvent.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    try {
      const event = await createEvent.mutateAsync({ name: newEvent.name, slug });
      toast('Event created');
      setShowCreate(false);
      setNewEvent({ name: '', slug: '' });
      navigate(`/events/${event.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event';
      toast(msg, 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteEvent.mutateAsync(id);
          toast('Event deleted');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to delete event';
          toast(msg, 'error');
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>Your Events</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: '#1A1A1A',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          New Event
        </button>
      </div>

      {showCreate && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #EFEFEF',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Create New Event</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              placeholder="Event name"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              style={{
                flex: '1',
                minWidth: '200px',
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #DADADA',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <input
              placeholder="URL slug (e.g. my-wedding)"
              value={newEvent.slug}
              onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
              style={{
                flex: '1',
                minWidth: '200px',
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: '1px solid #DADADA',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreate}
              disabled={createEvent.isPending}
              style={{
                padding: '0 24px',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                background: '#1A1A1A',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: createEvent.isPending ? 0.5 : 1,
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              style={{
                padding: '0 24px',
                height: '44px',
                borderRadius: '12px',
                border: '1px solid #DADADA',
                background: 'transparent',
                color: '#4A4A4A',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: '#4A4A4A', fontSize: '14px' }}>Loading...</p>
      ) : !events || events.length === 0 ? (
        <p style={{ color: '#4A4A4A', fontSize: '14px' }}>No events yet. Create one to get started.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #EFEFEF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>{event.name}</h3>
                <p style={{ fontSize: '13px', color: '#4A4A4A' }}>
                  {event.date ? new Date(event.date).toLocaleDateString() : 'No date set'}
                  {event.venue ? ` • ${event.venue}` : ''}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(event.id, event.name);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #DADADA',
                  background: 'transparent',
                  color: '#4A4A4A',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {dialog()}
    </div>
  );
}
