import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function EventSettingsPage() {
  const eventId = useParams<{ eventId: string }>().eventId ?? '';
  const { data: event, isLoading } = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [invitationEnabled, setInvitationEnabled] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Populate form fields once the event has loaded
  useEffect(() => {
    if (event) {
      setName(event.name ?? '');
      setSlug(event.slug ?? '');
      setDate(event.date ?? '');
      setTime(event.time ?? '');
      setVenue(event.venue ?? '');
      setLogoUrl(event.logo_url ?? '');
      setCoverUrl(event.cover_url ?? '');
      setAccentColor(event.accent_color ?? '#4f46e5');
      setInvitationEnabled(event.invitation_enabled ?? false);
    }
  }, [event]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (!trimmedName) {
      toast('Please enter an event name', 'error');
      return;
    }
    if (!trimmedSlug) {
      toast('Please enter a slug', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateEvent.mutateAsync({
        name: trimmedName,
        slug: trimmedSlug,
        date,
        time,
        venue,
        logo_url: logoUrl || null,
        cover_url: coverUrl || null,
        accent_color: accentColor,
        invitation_enabled: invitationEnabled,
      });
      toast('Event settings saved', 'success');
    } catch {
      toast('Failed to save event settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!eventId) return;
    try {
      await deleteEvent.mutateAsync(eventId);
      toast('Event deleted', 'success');
      setIsDeleteOpen(false);
    } catch {
      toast('Failed to delete event', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="es-page">
        <div className="es-loading">
          <p className="es-loading-text">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="es-page">
        <div className="es-error">
          <p className="es-error-text">Event not found.</p>
          <Link to="/" className="es-back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="es-page">
      <div className="es-container">
        {/* Header */}
        <div className="es-header">
          <Link to={`/events/${eventId}`} className="es-back-link">
            ← Back to event
          </Link>
          <h1 className="es-title">Event Settings</h1>
          <p className="es-subtitle">Edit the details for "{event.name}"</p>
        </div>

        {/* Form */}
        <div className="es-form">
          <div className="es-form-section">
            <h2 className="es-section-title">Basics</h2>

            <div className="es-field">
              <label className="es-label" htmlFor="es-name">
                Event name
              </label>
              <input
                id="es-name"
                type="text"
                className="es-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Event"
              />
            </div>

            <div className="es-field">
              <label className="es-label" htmlFor="es-slug">
                Slug
              </label>
              <input
                id="es-slug"
                type="text"
                className="es-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-awesome-event"
              />
              <span className="es-hint">
                Public URL: /e/{slug || 'your-slug'}
              </span>
            </div>

            <div className="es-field-row">
              <div className="es-field">
                <label className="es-label" htmlFor="es-date">
                  Date
                </label>
                <input
                  id="es-date"
                  type="date"
                  className="es-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="es-field">
                <label className="es-label" htmlFor="es-time">
                  Time
                </label>
                <input
                  id="es-time"
                  type="time"
                  className="es-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="es-field">
              <label className="es-label" htmlFor="es-venue">
                Venue
              </label>
              <input
                id="es-venue"
                type="text"
                className="es-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="123 Main Street, City"
              />
            </div>
          </div>

          <div className="es-form-section">
            <h2 className="es-section-title">Branding</h2>

            <div className="es-field">
              <label className="es-label" htmlFor="es-logo-url">
                Logo URL
              </label>
              <input
                id="es-logo-url"
                type="text"
                className="es-input"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="es-field">
              <label className="es-label" htmlFor="es-cover-url">
                Cover image URL
              </label>
              <input
                id="es-cover-url"
                type="text"
                className="es-input"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            <div className="es-field">
              <label className="es-label" htmlFor="es-accent-color">
                Accent color
              </label>
              <div className="es-color-row">
                <input
                  id="es-accent-color"
                  type="color"
                  className="es-color-picker"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <input
                  type="text"
                  className="es-input es-color-text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#4f46e5"
                />
              </div>
            </div>
          </div>

          <div className="es-form-section">
            <h2 className="es-section-title">Invitation</h2>

            <div className="es-field es-checkbox-field">
              <label className="es-checkbox-label">
                <input
                  type="checkbox"
                  className="es-checkbox"
                  checked={invitationEnabled}
                  onChange={(e) => setInvitationEnabled(e.target.checked)}
                />
                <span>Enable public invitation page</span>
              </label>
              <span className="es-hint">
                When enabled, guests can view the invitation at /i/{slug || 'your-slug'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="es-actions">
            <button
              className="es-btn es-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <Link to={`/events/${eventId}`} className="es-btn es-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>

        {/* Danger zone */}
        <div className="es-danger-zone">
          <h2 className="es-section-title es-danger-title">Danger zone</h2>
          <div className="es-danger-card">
            <div className="es-danger-content">
              <span className="es-danger-label">Delete this event</span>
              <span className="es-danger-desc">
                Permanently delete the event along with all guests, tables, RSVPs, and check-ins. This cannot be undone.
              </span>
            </div>
            <button
              className="es-btn es-btn-danger"
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete event
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        title="Delete event"
        message={`Are you sure you want to delete "${event.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
