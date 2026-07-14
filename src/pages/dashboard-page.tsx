import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/hooks/use-events';

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm, dialog } = useConfirmDialog();
  const navigate = useNavigate();

  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast('Please enter an event name and slug.', 'error');
      return;
    }
    if (!user) {
      toast('You must be signed in to create an event.', 'error');
      return;
    }

    try {
      const created = await createEvent.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        user_id: user.id,
        invitation_enabled: false,
      });
      toast('Event created successfully!', 'success');
      setName('');
      setSlug('');
      navigate(`/events/${created.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to create event.', 'error');
    }
  };

  const handleDelete = async (eventId: string) => {
    const ok = await confirm({
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!ok) return;

    try {
      await deleteEvent.mutateAsync(eventId);
      toast('Event deleted.', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to delete event.', 'error');
    }
  };

  return React.createElement(
    'div',
    { className: 'ee-container' },
    React.createElement('h1', { style: { fontSize: '28px', fontWeight: 700, marginBottom: '24px' } }, 'Your Events'),
    React.createElement(
      'div',
      { className: 'card mb-6' },
      React.createElement('h2', { className: 'ee-subsection-title', style: { marginTop: 0 } }, 'Create New Event'),
      React.createElement(
        'form',
        { onSubmit: handleCreate, className: 'ee-add-form' },
        React.createElement(
          'div',
          { className: 'ee-flex-input' },
          React.createElement('label', null, 'Event Name'),
          React.createElement('input', {
            type: 'text',
            value: name,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setName(e.target.value);
              setSlug(generateSlug(e.target.value));
            },
            placeholder: 'Wedding Reception',
          }),
        ),
        React.createElement(
          'div',
          { className: 'ee-flex-input' },
          React.createElement('label', null, 'Slug'),
          React.createElement('input', {
            type: 'text',
            value: slug,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSlug(generateSlug(e.target.value)),
            placeholder: 'wedding-reception',
          }),
        ),
        React.createElement('button', { type: 'submit', className: 'btn btn-primary', disabled: createEvent.isPending }, 'Create Event'),
      ),
    ),
    isLoading
      ? React.createElement('div', { className: 'text-center text-muted mt-6' }, 'Loading events...')
      : events && events.length === 0
        ? React.createElement('div', { className: 'card text-center text-muted' }, 'No events yet. Create one above to get started.')
        : React.createElement(
            'div',
            { className: 'ee-list' },
            events?.map((event) =>
              React.createElement(
                'div',
                { key: event.id, className: 'ee-list-row' },
                React.createElement(
                  Link,
                  { to: `/events/${event.id}`, style: { fontWeight: 500, fontSize: '15px' } },
                  event.name,
                ),
                React.createElement(
                  'div',
                  { className: 'ee-row-gap' },
                  React.createElement('span', { className: 'ee-muted' }, `/${event.slug}`),
                  React.createElement(
                    'button',
                    { className: 'btn btn-danger ee-btn-sm', onClick: () => handleDelete(event.id) },
                    'Delete',
                  ),
                ),
              ),
            ),
          ),
    dialog,
  );
}
