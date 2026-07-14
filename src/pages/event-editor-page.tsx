import { useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useBulkCreateGuests, useUpdateGuest, useDeleteGuest } from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import { DEFAULT_SETTINGS, FONT_OPTIONS, THEME_PRESETS } from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';

type Tab = 'details' | 'guests' | 'tables' | 'venue' | 'schedule' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Event Details' },
  { id: 'guests', label: 'Guests' },
  { id: 'tables', label: 'Tables' },
  { id: 'venue', label: 'Venue Layout' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'settings', label: 'Settings' },
];

export function EventEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const { data: guests } = useGuests(eventId);
  const { data: tables } = useTables(eventId);
  const { data: settings } = useGuestPageSettings(eventId);
  const upsertSettings = useUpsertGuestPageSettings();

  const createGuest = useCreateGuest();
  const bulkCreateGuests = useBulkCreateGuests();
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();

  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [deleteOpen, setDeleteOpen] = useState(false);

  // --- Event Details state ---
  const [detailsForm, setDetailsForm] = useState({
    name: '',
    slug: '',
    date: '',
    time: '',
    venue: '',
  });
  const [detailsInit, setDetailsInit] = useState(false);

  // Initialize details form from event data
  if (event && !detailsInit) {
    setDetailsForm({
      name: event.name ?? '',
      slug: event.slug ?? '',
      date: event.date ?? '',
      time: event.time ?? '',
      venue: event.venue ?? '',
    });
    setDetailsInit(true);
  }

  // --- Guests state ---
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '', party_size: 1, dietary_notes: '' });
  const [bulkText, setBulkText] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', party_size: 1, dietary_notes: '', table_id: '' });

  // --- Tables state ---
  const [tableForm, setTableForm] = useState({ number: '', name: '', capacity: 8 });

  // --- Venue Layout state ---
  const [venueDragging, setVenueDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Schedule state ---
  const [scheduleItems, setScheduleItems] = useState<{ time: string; label: string }[]>([]);
  const [scheduleInit, setScheduleInit] = useState(false);

  if (settings && !scheduleInit) {
    setScheduleItems(settings.schedule_items ?? []);
    setScheduleInit(true);
  }

  // --- Settings (guest page) state ---
  const [settingsForm, setSettingsForm] = useState<GuestPageSettingsInput>({ ...DEFAULT_SETTINGS, event_id: eventId ?? '' });
  const [settingsInit, setSettingsInit] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  if (settings && !settingsInit) {
    setSettingsForm({
      event_id: eventId ?? '',
      venue_image_url: settings.venue_image_url,
      cover_image: settings.cover_image,
      logo_url: settings.logo_url,
      color_primary: settings.color_primary,
      color_secondary: settings.color_secondary,
      color_background: settings.color_background,
      color_button: settings.color_button,
      color_button_text: settings.color_button_text,
      color_link: settings.color_link,
      color_footer: settings.color_footer,
      font_heading: settings.font_heading,
      font_body: settings.font_body,
      radius: settings.radius,
      schedule_items: settings.schedule_items ?? [],
    });
    setSettingsInit(true);
  }

  // === Handlers ===

  const handleSaveDetails = useCallback(async () => {
    if (!eventId) return;
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        name: detailsForm.name,
        slug: detailsForm.slug,
        date: detailsForm.date || null,
        time: detailsForm.time || null,
        venue: detailsForm.venue || null,
      });
      toast('Event details saved', 'success');
    } catch {
      toast('Failed to save event details', 'error');
    }
  }, [eventId, detailsForm, updateEvent, toast]);

  const handleAddGuest = useCallback(async () => {
    if (!eventId || !guestForm.name.trim()) return;
    try {
      await createGuest.mutateAsync({
        event_id: eventId,
        name: guestForm.name.trim(),
        email: guestForm.email.trim() || null,
        phone: guestForm.phone.trim() || null,
        party_size: guestForm.party_size,
        dietary_notes: guestForm.dietary_notes.trim() || null,
      });
      setGuestForm({ name: '', email: '', phone: '', party_size: 1, dietary_notes: '' });
      toast('Guest added', 'success');
    } catch {
      toast('Failed to add guest', 'error');
    }
  }, [eventId, guestForm, createGuest, toast]);

  const handleBulkAdd = useCallback(async () => {
    if (!eventId || !bulkText.trim()) return;
    const lines = bulkText.trim().split('\n').filter((l) => l.trim());
    const inputs = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        event_id: eventId,
        name: parts[0] ?? '',
        email: parts[1] || null,
        phone: parts[2] || null,
        party_size: 1,
      };
    }).filter((g) => g.name);
    if (inputs.length === 0) return;
    try {
      await bulkCreateGuests.mutateAsync(inputs);
      setBulkText('');
      setBulkOpen(false);
      toast(`${inputs.length} guests added`, 'success');
    } catch {
      toast('Failed to add guests', 'error');
    }
  }, [eventId, bulkText, bulkCreateGuests, toast]);

  const startEditGuest = useCallback((guest: GuestWithTable) => {
    setEditingGuestId(guest.id);
    setEditForm({
      name: guest.name,
      email: guest.email ?? '',
      phone: guest.phone ?? '',
      party_size: guest.party_size,
      dietary_notes: guest.dietary_notes ?? '',
      table_id: guest.table_id ?? '',
    });
  }, []);

  const handleSaveEditGuest = useCallback(async () => {
    if (!eventId || !editingGuestId) return;
    try {
      await updateGuest.mutateAsync({
        id: editingGuestId,
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        party_size: editForm.party_size,
        dietary_notes: editForm.dietary_notes.trim() || null,
        table_id: editForm.table_id || null,
      });
      setEditingGuestId(null);
      toast('Guest updated', 'success');
    } catch {
      toast('Failed to update guest', 'error');
    }
  }, [eventId, editingGuestId, editForm, updateGuest, toast]);

  const handleDeleteGuest = useCallback(async (id: string) => {
    if (!eventId) return;
    try {
      await deleteGuest.mutateAsync({ id, eventId });
      toast('Guest removed', 'success');
    } catch {
      toast('Failed to remove guest', 'error');
    }
  }, [eventId, deleteGuest, toast]);

  const handleAddTable = useCallback(async () => {
    if (!eventId || !tableForm.number.trim()) return;
    try {
      await createTable.mutateAsync({
        event_id: eventId,
        number: tableForm.number.trim(),
        name: tableForm.name.trim() || tableForm.number.trim(),
        capacity: tableForm.capacity,
      });
      setTableForm({ number: '', name: '', capacity: 8 });
      toast('Table added', 'success');
    } catch {
      toast('Failed to add table', 'error');
    }
  }, [eventId, tableForm, createTable, toast]);

  const handleDeleteTable = useCallback(async (id: string) => {
    if (!eventId) return;
    try {
      await deleteTable.mutateAsync({ id, eventId });
      toast('Table removed', 'success');
    } catch {
      toast('Failed to remove table', 'error');
    }
  }, [eventId, deleteTable, toast]);

  const handleVenueFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSettingsForm((prev) => ({ ...prev, venue_image_url: dataUrl }));
      // Also persist immediately
      if (eventId) {
        upsertSettings.mutateAsync({
          ...settingsForm,
          event_id: eventId,
          venue_image_url: dataUrl,
        }).then(() => toast('Venue layout uploaded', 'success'))
          .catch(() => toast('Failed to save venue image', 'error'));
      }
    };
    reader.readAsDataURL(file);
  }, [eventId, settingsForm, upsertSettings, toast]);

  const handleVenueDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setVenueDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleVenueFile(file);
  }, [handleVenueFile]);

  const handleVenueClear = useCallback(() => {
    setSettingsForm((prev) => ({ ...prev, venue_image_url: null }));
    if (eventId) {
      upsertSettings.mutateAsync({
        ...settingsForm,
        event_id: eventId,
        venue_image_url: null,
      }).then(() => toast('Venue image removed', 'success'))
        .catch(() => toast('Failed to remove venue image', 'error'));
    }
  }, [eventId, settingsForm, upsertSettings, toast]);

  const handleAddScheduleItem = useCallback(() => {
    setScheduleItems((prev) => [...prev, { time: '', label: '' }]);
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    if (!eventId) return;
    try {
      await upsertSettings.mutateAsync({
        ...settingsForm,
        event_id: eventId,
        schedule_items: scheduleItems.filter((s) => s.time || s.label),
      });
      toast('Schedule saved', 'success');
    } catch {
      toast('Failed to save schedule', 'error');
    }
  }, [eventId, settingsForm, scheduleItems, upsertSettings, toast]);

  const handleSaveSettings = useCallback(async () => {
    if (!eventId) return;
    try {
      await upsertSettings.mutateAsync({
        ...settingsForm,
        event_id: eventId,
      });
      toast('Guest page settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    }
  }, [eventId, settingsForm, upsertSettings, toast]);

  const handleDeleteEvent = useCallback(async () => {
    if (!eventId) return;
    try {
      await deleteEvent.mutateAsync(eventId);
      toast('Event deleted', 'success');
      navigate('/');
    } catch {
      toast('Failed to delete event', 'error');
    }
  }, [eventId, deleteEvent, toast, navigate]);

  // === Loading ===
  if (eventLoading) {
    return (
      <>
        <style>{EE_CSS}</style>
        <div className="ee-loading">
          <div className="ee-spinner" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <style>{EE_CSS}</style>
        <div className="ee-loading">
          <p className="ee-empty-text">Event not found.</p>
          <Link to="/" className="ee-back-link">← Back to Dashboard</Link>
        </div>
      </>
    );
  }

  const guestList = guests ?? [];
  const tableList = tables ?? [];

  return (
    <>
      <style>{EE_CSS}</style>
      <div className="ee-root">
        {/* Header */}
        <header className="ee-header">
          <div className="ee-header-left">
            <Link to="/" className="ee-back-link">← Dashboard</Link>
            <h1 className="ee-title">{event.name}</h1>
          </div>
          <div className="ee-header-actions">
            <Link to={`/events/${event.id}/print/seating`} target="_blank" className="ee-ghost-btn">Print Seating</Link>
            <Link to={`/events/${event.id}/print/guests`} target="_blank" className="ee-ghost-btn">Print Guest List</Link>
            <Link to={`/e/${event.slug}`} target="_blank" className="ee-ghost-btn">View Guest Page</Link>
          </div>
        </header>

        {/* Tabs */}
        <nav className="ee-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ee-tab${activeTab === tab.id ? ' ee-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Panels — all mounted, inactive hidden */}
        <div className="ee-panels">
          {/* === Event Details === */}
          <section className="ee-panel" style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
            <h2 className="ee-section-title">Event Details</h2>
            <div className="ee-form-grid">
              <div className="ee-field">
                <label className="ee-label">Event Name</label>
                <input
                  className="ee-input"
                  value={detailsForm.name}
                  onChange={(e) => setDetailsForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Slug</label>
                <input
                  className="ee-input"
                  value={detailsForm.slug}
                  onChange={(e) => setDetailsForm((p) => ({ ...p, slug: e.target.value }))}
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Date</label>
                <input
                  type="date"
                  className="ee-input"
                  value={detailsForm.date}
                  onChange={(e) => setDetailsForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Time</label>
                <input
                  type="time"
                  className="ee-input"
                  value={detailsForm.time}
                  onChange={(e) => setDetailsForm((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
              <div className="ee-field ee-field--full">
                <label className="ee-label">Venue</label>
                <input
                  className="ee-input"
                  value={detailsForm.venue}
                  onChange={(e) => setDetailsForm((p) => ({ ...p, venue: e.target.value }))}
                />
              </div>
            </div>
            <div className="ee-form-actions">
              <button
                className="ee-primary-btn"
                onClick={handleSaveDetails}
                disabled={updateEvent.isPending}
              >
                {updateEvent.isPending ? 'Saving…' : 'Save Details'}
              </button>
            </div>
          </section>

          {/* === Guests === */}
          <section className="ee-panel" style={{ display: activeTab === 'guests' ? 'block' : 'none' }}>
            <div className="ee-panel-header">
              <h2 className="ee-section-title">Guests ({guestList.length})</h2>
              <button className="ee-ghost-btn" onClick={() => setBulkOpen(true)}>Bulk Add</button>
            </div>

            <div className="ee-inline-form">
              <input
                className="ee-input"
                placeholder="Guest name"
                value={guestForm.name}
                onChange={(e) => setGuestForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="ee-input"
                placeholder="Email (optional)"
                value={guestForm.email}
                onChange={(e) => setGuestForm((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="ee-input"
                placeholder="Phone (optional)"
                value={guestForm.phone}
                onChange={(e) => setGuestForm((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                type="number"
                className="ee-input ee-input--narrow"
                min={1}
                value={guestForm.party_size}
                onChange={(e) => setGuestForm((p) => ({ ...p, party_size: parseInt(e.target.value) || 1 }))}
              />
              <button
                className="ee-primary-btn"
                onClick={handleAddGuest}
                disabled={createGuest.isPending || !guestForm.name.trim()}
              >
                Add Guest
              </button>
            </div>

            <div className="ee-table-wrap">
              <table className="ee-data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Party</th>
                    <th>Table</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guestList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="ee-empty-row">No guests yet. Add one above or use Bulk Add.</td>
                    </tr>
                  )}
                  {guestList.map((guest) => (
                    editingGuestId === guest.id ? (
                      <tr key={guest.id}>
                        <td>
                          <input className="ee-input ee-input--small" value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                        </td>
                        <td>
                          <input className="ee-input ee-input--small" value={editForm.email}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                        </td>
                        <td>
                          <input className="ee-input ee-input--small" value={editForm.phone}
                            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
                        </td>
                        <td>
                          <input type="number" className="ee-input ee-input--small" min={1} value={editForm.party_size}
                            onChange={(e) => setEditForm((p) => ({ ...p, party_size: parseInt(e.target.value) || 1 }))} />
                        </td>
                        <td>
                          <select className="ee-input ee-input--small" value={editForm.table_id}
                            onChange={(e) => setEditForm((p) => ({ ...p, table_id: e.target.value }))}>
                            <option value="">—</option>
                            {tableList.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="ee-row-actions">
                            <button className="ee-icon-btn ee-icon-btn--save" onClick={handleSaveEditGuest}
                              disabled={updateGuest.isPending}>✓</button>
                            <button className="ee-icon-btn" onClick={() => setEditingGuestId(null)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={guest.id}>
                        <td className="ee-cell-name">{guest.name}</td>
                        <td>{guest.email ?? '—'}</td>
                        <td>{guest.phone ?? '—'}</td>
                        <td>{guest.party_size}</td>
                        <td>{guest.table ? guest.table.name : '—'}</td>
                        <td>
                          <div className="ee-row-actions">
                            <button className="ee-icon-btn" onClick={() => startEditGuest(guest)}>Edit</button>
                            <button className="ee-icon-btn ee-icon-btn--danger"
                              onClick={() => handleDeleteGuest(guest.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* === Tables === */}
          <section className="ee-panel" style={{ display: activeTab === 'tables' ? 'block' : 'none' }}>
            <h2 className="ee-section-title">Tables ({tableList.length})</h2>

            <div className="ee-inline-form">
              <input
                className="ee-input"
                placeholder="Table number"
                value={tableForm.number}
                onChange={(e) => setTableForm((p) => ({ ...p, number: e.target.value }))}
              />
              <input
                className="ee-input"
                placeholder="Table name (optional)"
                value={tableForm.name}
                onChange={(e) => setTableForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                type="number"
                className="ee-input ee-input--narrow"
                min={1}
                value={tableForm.capacity}
                onChange={(e) => setTableForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 8 }))}
              />
              <button
                className="ee-primary-btn"
                onClick={handleAddTable}
                disabled={createTable.isPending || !tableForm.number.trim()}
              >
                Add Table
              </button>
            </div>

            <div className="ee-cards-grid">
              {tableList.length === 0 && <p className="ee-empty-row">No tables yet.</p>}
              {tableList.map((tbl) => {
                const assigned = guestList.filter((g) => g.table_id === tbl.id);
                return (
                  <div key={tbl.id} className="ee-table-card">
                    <div className="ee-table-card-header">
                      <div>
                        <span className="ee-table-card-number">{tbl.number}</span>
                        <span className="ee-table-card-name">{tbl.name}</span>
                      </div>
                      <button
                        className="ee-icon-btn ee-icon-btn--danger"
                        onClick={() => handleDeleteTable(tbl.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="ee-table-card-stats">
                      <span>Capacity: {tbl.capacity}</span>
                      <span>Assigned: {assigned.length}</span>
                    </div>
                    <div className="ee-table-card-guests">
                      {assigned.length === 0 ? (
                        <span className="ee-muted">No guests assigned</span>
                      ) : (
                        assigned.map((g) => (
                          <span key={g.id} className="ee-chip">{g.name}</span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* === Venue Layout === */}
          <section className="ee-panel" style={{ display: activeTab === 'venue' ? 'block' : 'none' }}>
            <h2 className="ee-section-title">Venue Layout</h2>
            <p className="ee-help-text">
              Upload a floor plan or venue layout image. Guests will see this on the "Find Your Seat" page.
            </p>

            {settingsForm.venue_image_url ? (
              <div className="ee-venue-preview">
                <img src={settingsForm.venue_image_url} alt="Venue layout" className="ee-venue-img" />
                <div className="ee-venue-actions">
                  <button className="ee-ghost-btn" onClick={() => fileInputRef.current?.click()}>
                    Replace
                  </button>
                  <button className="ee-ghost-btn ee-ghost-btn--danger" onClick={handleVenueClear}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`ee-dropzone${venueDragging ? ' ee-dropzone--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setVenueDragging(true); }}
                onDragLeave={() => setVenueDragging(false)}
                onDrop={handleVenueDrop}
              >
                <div className="ee-dropzone-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="48" height="48">
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="ee-dropzone-text">Drag & drop venue image here</p>
                <p className="ee-dropzone-hint">or click to browse · PNG, JPG up to 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVenueFile(file);
                e.target.value = '';
              }}
            />
          </section>

          {/* === Schedule === */}
          <section className="ee-panel" style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
            <div className="ee-panel-header">
              <h2 className="ee-section-title">Schedule</h2>
              <button className="ee-ghost-btn" onClick={handleAddScheduleItem}>+ Add Item</button>
            </div>
            <p className="ee-help-text">Add the event timeline. This appears on the guest page.</p>

            <div className="ee-schedule-list">
              {scheduleItems.length === 0 && <p className="ee-empty-row">No schedule items yet.</p>}
              {scheduleItems.map((item, idx) => (
                <div key={idx} className="ee-schedule-row">
                  <input
                    type="time"
                    className="ee-input ee-input--time"
                    value={item.time}
                    onChange={(e) => setScheduleItems((prev) =>
                      prev.map((s, i) => i === idx ? { ...s, time: e.target.value } : s)
                    )}
                  />
                  <input
                    className="ee-input"
                    placeholder="e.g. Ceremony begins"
                    value={item.label}
                    onChange={(e) => setScheduleItems((prev) =>
                      prev.map((s, i) => i === idx ? { ...s, label: e.target.value } : s)
                    )}
                  />
                  <button
                    className="ee-icon-btn ee-icon-btn--danger"
                    onClick={() => setScheduleItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {scheduleItems.length > 0 && (
              <div className="ee-form-actions">
                <button
                  className="ee-primary-btn"
                  onClick={handleSaveSchedule}
                  disabled={upsertSettings.isPending}
                >
                  {upsertSettings.isPending ? 'Saving…' : 'Save Schedule'}
                </button>
              </div>
            )}
          </section>

          {/* === Settings === */}
          <section className="ee-panel" style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
            <h2 className="ee-section-title">Guest Page Settings</h2>

            {/* Theme Presets */}
            <h3 className="ee-subsection-title">Theme Presets</h3>
            <div className="ee-preset-grid">
              {THEME_PRESETS.map((preset) => {
                const isActive = settingsForm.color_primary === preset.color_primary &&
                  settingsForm.color_background === preset.color_background;
                return (
                  <button
                    key={preset.name}
                    className={`ee-preset-card${isActive ? ' ee-preset-card--active' : ''}`}
                    onClick={() => setSettingsForm((prev) => ({
                      ...prev,
                      color_primary: preset.color_primary,
                      color_secondary: preset.color_secondary,
                      color_background: preset.color_background,
                      color_button: preset.color_button,
                      color_button_text: preset.color_button_text,
                      color_link: preset.color_link,
                      color_footer: preset.color_footer,
                    }))}
                  >
                    <div className="ee-preset-swatches">
                      <span style={{ background: preset.color_primary }} />
                      <span style={{ background: preset.color_background }} />
                      <span style={{ background: preset.color_button }} />
                    </div>
                    <span className="ee-preset-name">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Pickers */}
            <h3 className="ee-subsection-title">Colors</h3>
            <div className="ee-color-grid">
              <div className="ee-color-field">
                <label className="ee-label">Primary</label>
                <div className="ee-color-row">
                  <input
                    type="color"
                    className="ee-color-picker"
                    value={settingsForm.color_primary ?? '#1A1A1A'}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, color_primary: e.target.value }))}
                  />
                  <input
                    className="ee-input ee-input--hex"
                    value={settingsForm.color_primary ?? '#1A1A1A'}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, color_primary: e.target.value }))}
                  />
                </div>
              </div>
              <div className="ee-color-field">
                <label className="ee-label">Background</label>
                <div className="ee-color-row">
                  <input
                    type="color"
                    className="ee-color-picker"
                    value={settingsForm.color_background ?? '#FFFFFF'}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, color_background: e.target.value }))}
                  />
                  <input
                    className="ee-input ee-input--hex"
                    value={settingsForm.color_background ?? '#FFFFFF'}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, color_background: e.target.value }))}
                  />
                </div>
              </div>
              <div className="ee-color-field">
                <label className="ee-label">Button</label>
                <div className="ee-color-row">
                  <input
                    type="color"
                    className="ee-color-picker"
                    value={settingsForm.color_button ?? '#1A1A1A'}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, color_button: e.target.value }))}
                  />
                  <input
                    className="ee-input ee-input--hex"
                    value={settingsForm.color_button ?? '#1A1A1A'}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, color_button: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Font Dropdowns */}
            <h3 className="ee-subsection-title">Fonts</h3>
            <div className="ee-form-grid">
              <div className="ee-field">
                <label className="ee-label">Heading Font</label>
                <select
                  className="ee-input"
                  value={settingsForm.font_heading ?? 'Inter'}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, font_heading: e.target.value }))}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="ee-field">
                <label className="ee-label">Body Font</label>
                <select
                  className="ee-input"
                  value={settingsForm.font_body ?? 'Inter'}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, font_body: e.target.value }))}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Preview */}
            <h3 className="ee-subsection-title">Live Preview</h3>
            <div className="ee-preview-toolbar">
              <div className="ee-device-toggle">
                <button
                  className={`ee-device-btn${previewDevice === 'desktop' ? ' ee-device-btn--active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  Desktop
                </button>
                <button
                  className={`ee-device-btn${previewDevice === 'mobile' ? ' ee-device-btn--active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className="ee-preview-sticky">
              <div className={`ee-preview-frame${previewDevice === 'mobile' ? ' ee-preview-frame--mobile' : ''}`}>
                <div
                  className="ee-preview-card"
                  style={{
                    background: settingsForm.color_background ?? '#FFFFFF',
                    fontFamily: settingsForm.font_body ?? 'Inter',
                    borderRadius: `${settingsForm.radius ?? 8}px`,
                  }}
                >
                  <h3
                    className="ee-preview-heading"
                    style={{
                      color: settingsForm.color_primary ?? '#1A1A1A',
                      fontFamily: settingsForm.font_heading ?? 'Inter',
                    }}
                  >
                    {event.name}
                  </h3>
                  {event.date && (
                    <p className="ee-preview-date" style={{ color: settingsForm.color_secondary ?? '#4A4A4A' }}>
                      {event.date}{event.time ? ` · ${event.time}` : ''}
                    </p>
                  )}
                  {event.venue && (
                    <p className="ee-preview-venue" style={{ color: settingsForm.color_secondary ?? '#4A4A4A' }}>
                      {event.venue}
                    </p>
                  )}
                  <button
                    className="ee-preview-btn"
                    style={{
                      background: settingsForm.color_button ?? '#1A1A1A',
                      color: settingsForm.color_button_text ?? '#FFFFFF',
                      borderRadius: `${settingsForm.radius ?? 8}px`,
                    }}
                  >
                    Find Your Seat
                  </button>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="ee-form-actions">
              <button
                className="ee-primary-btn"
                onClick={handleSaveSettings}
                disabled={upsertSettings.isPending}
              >
                {upsertSettings.isPending ? 'Saving…' : 'Save Settings'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="ee-danger-zone">
              <h3 className="ee-danger-title">Danger Zone</h3>
              <p className="ee-danger-text">Deleting an event permanently removes all guests, tables, and settings.</p>
              <button className="ee-danger-btn" onClick={() => setDeleteOpen(true)}>
                Delete Event
              </button>
            </div>
          </section>
        </div>

        {/* Bulk Add Modal */}
        <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} width={520}>
          <h2 className="ee-modal-title">Bulk Add Guests</h2>
          <p className="ee-modal-hint">One guest per line. Format: <code>Name, Email, Phone</code></p>
          <textarea
            className="ee-bulk-textarea"
            placeholder={'John Doe, john@example.com\nJane Smith\nBob Johnson, bob@example.com, 555-0100'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
          />
          <div className="ee-modal-actions">
            <button className="ee-ghost-btn" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button
              className="ee-primary-btn"
              onClick={handleBulkAdd}
              disabled={bulkCreateGuests.isPending || !bulkText.trim()}
            >
              {bulkCreateGuests.isPending ? 'Adding…' : 'Add Guests'}
            </button>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <ConfirmDialog
          open={deleteOpen}
          title="Delete Event"
          message={`Are you sure you want to delete "${event.name}"? This will permanently remove all guests, tables, and settings. This action cannot be undone.`}
          confirmLabel="Delete Event"
          cancelLabel="Cancel"
          onConfirm={handleDeleteEvent}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    </>
  );
}

const EE_CSS = `
.ee-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1A1A1A;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.ee-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-family: 'Inter', system-ui, sans-serif;
  gap: 16px;
}

.ee-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #EFEFEF;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: ee-spin 0.8s linear infinite;
}

@keyframes ee-spin {
  to { transform: rotate(360deg); }
}

.ee-empty-text {
  color: #4A4A4A;
  font-size: 16px;
  margin: 0;
}

.ee-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.ee-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ee-back-link {
  color: #4A4A4A;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.15s;
}

.ee-back-link:hover {
  color: #1A1A1A;
}

.ee-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
}

.ee-header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ee-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #EFEFEF;
  margin-bottom: 24px;
  overflow-x: auto;
}

.ee-tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #4A4A4A;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  font-family: inherit;
}

.ee-tab:hover {
  color: #1A1A1A;
}

.ee-tab--active {
  color: #1A1A1A;
  border-bottom-color: #1A1A1A;
  font-weight: 600;
}

.ee-panels {
  min-height: 400px;
}

.ee-panel {
  animation: ee-fade 0.2s ease;
}

@keyframes ee-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ee-section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #1A1A1A;
}

.ee-subsection-title {
  font-size: 15px;
  font-weight: 600;
  margin: 28px 0 12px 0;
  color: #1A1A1A;
}

.ee-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.ee-panel-header .ee-section-title {
  margin: 0;
}

.ee-help-text {
  color: #4A4A4A;
  font-size: 14px;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.ee-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.ee-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ee-field--full {
  grid-column: 1 / -1;
}

.ee-label {
  font-size: 13px;
  font-weight: 500;
  color: #4A4A4A;
}

.ee-input {
  padding: 10px 14px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.ee-input:focus {
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}

.ee-input--narrow {
  max-width: 80px;
}

.ee-input--small {
  padding: 6px 10px;
  font-size: 13px;
}

.ee-input--time {
  max-width: 120px;
}

.ee-input--hex {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  max-width: 120px;
}

.ee-inline-form {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.ee-inline-form .ee-input {
  flex: 1;
  min-width: 120px;
}

.ee-primary-btn {
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
  white-space: nowrap;
}

.ee-primary-btn:hover:not(:disabled) {
  background: #4A4A4A;
}

.ee-primary-btn:disabled {
  background: #DADADA;
  cursor: not-allowed;
}

.ee-ghost-btn {
  padding: 8px 16px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.ee-ghost-btn:hover {
  border-color: #1A1A1A;
  color: #1A1A1A;
}

.ee-ghost-btn--danger:hover {
  border-color: #1A1A1A;
  background: #1A1A1A;
  color: #FFFFFF;
}

.ee-form-actions {
  margin-top: 24px;
}

.ee-table-wrap {
  overflow-x: auto;
  border: 1px solid #EFEFEF;
  border-radius: 12px;
}

.ee-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.ee-data-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: #4A4A4A;
  border-bottom: 1px solid #EFEFEF;
  background: #F8F8F8;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.ee-data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #EFEFEF;
  color: #1A1A1A;
}

.ee-data-table tr:last-child td {
  border-bottom: none;
}

.ee-data-table tr:hover {
  background: #F8F8F8;
}

.ee-cell-name {
  font-weight: 500;
}

.ee-empty-row {
  text-align: center;
  color: #4A4A4A;
  padding: 32px 16px !important;
  font-size: 14px;
}

.ee-row-actions {
  display: flex;
  gap: 6px;
}

.ee-icon-btn {
  padding: 4px 12px;
  border: 1px solid #DADADA;
  border-radius: 6px;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.ee-icon-btn:hover {
  border-color: #1A1A1A;
  color: #1A1A1A;
}

.ee-icon-btn--save {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}

.ee-icon-btn--danger:hover {
  background: #1A1A1A;
  color: #FFFFFF;
  border-color: #1A1A1A;
}

.ee-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.ee-table-card {
  border: 1px solid #EFEFEF;
  border-radius: 12px;
  padding: 16px;
  background: #FFFFFF;
  transition: border-color 0.15s;
}

.ee-table-card:hover {
  border-color: #DADADA;
}

.ee-table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ee-table-card-number {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
  margin-right: 8px;
}

.ee-table-card-name {
  font-size: 14px;
  color: #4A4A4A;
}

.ee-table-card-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #4A4A4A;
  margin-bottom: 12px;
}

.ee-table-card-guests {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ee-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  background: #F8F8F8;
  border: 1px solid #EFEFEF;
  font-size: 12px;
  color: #4A4A4A;
}

.ee-muted {
  color: #4A4A4A;
  font-size: 13px;
}

/* Dropzone */
.ee-dropzone {
  border: 2px dashed #DADADA;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: #F8F8F8;
}

.ee-dropzone:hover {
  border-color: #4A4A4A;
  background: #EFEFEF;
}

.ee-dropzone--active {
  border-color: #1A1A1A;
  background: #EFEFEF;
}

.ee-dropzone-icon {
  color: #4A4A4A;
  margin-bottom: 12px;
}

.ee-dropzone-text {
  font-size: 15px;
  font-weight: 500;
  color: #1A1A1A;
  margin: 0 0 4px 0;
}

.ee-dropzone-hint {
  font-size: 13px;
  color: #4A4A4A;
  margin: 0;
}

.ee-venue-preview {
  border: 1px solid #EFEFEF;
  border-radius: 12px;
  overflow: hidden;
  background: #F8F8F8;
}

.ee-venue-img {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  display: block;
  background: #F8F8F8;
}

.ee-venue-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #EFEFEF;
  background: #FFFFFF;
}

/* Schedule */
.ee-schedule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ee-schedule-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ee-schedule-row .ee-input:last-of-type {
  flex: 1;
}

/* Settings: Presets */
.ee-preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.ee-preset-card {
  border: 2px solid #EFEFEF;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  background: #FFFFFF;
  text-align: left;
  transition: border-color 0.15s;
  font-family: inherit;
}

.ee-preset-card:hover {
  border-color: #DADADA;
}

.ee-preset-card--active {
  border-color: #1A1A1A;
}

.ee-preset-swatches {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.ee-preset-swatches span {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #EFEFEF;
}

.ee-preset-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A1A;
}

/* Color pickers */
.ee-color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.ee-color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ee-color-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ee-color-picker {
  width: 40px;
  height: 40px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: #FFFFFF;
}

/* Preview */
.ee-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ee-device-toggle {
  display: inline-flex;
  border: 1px solid #DADADA;
  border-radius: 8px;
  overflow: hidden;
}

.ee-device-btn {
  padding: 6px 16px;
  border: none;
  background: #FFFFFF;
  color: #4A4A4A;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.ee-device-btn--active {
  background: #1A1A1A;
  color: #FFFFFF;
}

.ee-preview-sticky {
  position: sticky;
  bottom: 24px;
  background: #F8F8F8;
  border: 1px solid #EFEFEF;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  justify-content: center;
  overflow: auto;
}

.ee-preview-frame {
  width: 100%;
  max-width: 600px;
  transition: max-width 0.3s;
}

.ee-preview-frame--mobile {
  max-width: 360px;
}

.ee-preview-card {
  padding: 32px;
  text-align: center;
  border: 1px solid #EFEFEF;
}

.ee-preview-heading {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.ee-preview-date {
  font-size: 14px;
  margin: 0 0 4px 0;
}

.ee-preview-venue {
  font-size: 14px;
  margin: 0 0 20px 0;
}

.ee-preview-btn {
  display: inline-block;
  padding: 10px 28px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* Danger Zone */
.ee-danger-zone {
  margin-top: 40px;
  padding: 20px;
  border: 1px solid #DADADA;
  border-radius: 12px;
  background: #F8F8F8;
}

.ee-danger-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1A1A1A;
}

.ee-danger-text {
  font-size: 14px;
  color: #4A4A4A;
  margin: 0 0 16px 0;
}

.ee-danger-btn {
  padding: 10px 24px;
  border: 1px solid #1A1A1A;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A1A1A;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.ee-danger-btn:hover {
  background: #1A1A1A;
  color: #FFFFFF;
}

/* Modal */
.ee-modal-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1A1A1A;
}

.ee-modal-hint {
  font-size: 14px;
  color: #4A4A4A;
  margin: 0 0 16px 0;
}

.ee-modal-hint code {
  background: #F8F8F8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.ee-bulk-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #DADADA;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  color: #1A1A1A;
  background: #FFFFFF;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}

.ee-bulk-textarea:focus {
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26,26,26,0.06);
}

.ee-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  ee-form-grid,
  .ee-form-grid {
    grid-template-columns: 1fr;
  }
  .ee-color-grid {
    grid-template-columns: 1fr;
  }
  .ee-header-actions {
    width: 100%;
  }
}
`;
