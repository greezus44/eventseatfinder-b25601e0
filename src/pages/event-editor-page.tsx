import { useState, useRef, useEffect, useCallback, type CSSProperties, type ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/use-events';
import { useGuests, useCreateGuest, useBulkCreateGuests, useUpdateGuest, useDeleteGuest } from '@/hooks/use-guests';
import { useTables, useCreateTable, useDeleteTable, useUpdateTablePosition } from '@/hooks/use-tables';
import { useGuestPageSettings, useUpsertGuestPageSettings } from '@/hooks/use-guest-page-settings';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog, Modal } from '@/components/ui/confirm-dialog';
import { DEFAULT_SETTINGS, FONT_OPTIONS, COLOR_PRESETS } from '@/types/guest-page-settings';
import type { GuestPageSettingsInput } from '@/types/guest-page-settings';
import type { GuestWithTable } from '@/types/guest';
import type { Table } from '@/types/table';
import type { Event } from '@/types/event';

type TabKey = 'details' | 'guests' | 'tables' | 'venue' | 'invitation' | 'schedule' | 'settings';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'Event Details' },
  { key: 'guests', label: 'Guests' },
  { key: 'tables', label: 'Tables' },
  { key: 'venue', label: 'Venue Layout' },
  { key: 'invitation', label: 'Invitation' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'settings', label: 'Settings' },
];

export function EventEditorPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: guests = [], isLoading: guestsLoading } = useGuests(eventId);
  const { data: tables = [] } = useTables(eventId);
  const { data: settings } = useGuestPageSettings(eventId);

  const updateEvent = useUpdateEvent(eventId);
  const deleteEvent = useDeleteEvent();
  const createGuest = useCreateGuest(eventId);
  const bulkCreateGuests = useBulkCreateGuests(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const deleteGuest = useDeleteGuest(eventId);
  const createTable = useCreateTable(eventId);
  const deleteTable = useDeleteTable(eventId);
  const updateTablePosition = useUpdateTablePosition(eventId);
  const upsertSettings = useUpsertGuestPageSettings(eventId);

  const [activeTab, setActiveTab] = useState<TabKey>('details');

  // ── Event Details form state ──
  const [detailsForm, setDetailsForm] = useState<Partial<Event>>({});
  const [detailsSaving, setDetailsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setDetailsForm({
        name: event.name,
        slug: event.slug,
        date: event.date,
        time: event.time,
        venue: event.venue,
        logo_url: event.logo_url,
        cover_url: event.cover_url,
        accent_color: event.accent_color,
        invitation_enabled: event.invitation_enabled,
      });
    }
  }, [event]);

  // ── Guest modal state ──
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [bulkGuestOpen, setBulkGuestOpen] = useState(false);
  const [editGuestOpen, setEditGuestOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestTableId, setNewGuestTableId] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestTableId, setEditGuestTableId] = useState('');
  const [editGuestId, setEditGuestId] = useState<string | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [deleteGuestId, setDeleteGuestId] = useState<string | null>(null);

  // ── Table modal state ──
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null);

  // ── Venue drag state ──
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Schedule state ──
  const [scheduleForm, setScheduleForm] = useState<GuestPageSettingsInput>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // ── Settings state ──
  const [settingsForm, setSettingsForm] = useState<GuestPageSettingsInput>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ── Delete event state ──
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);

  useEffect(() => {
    const s = settings ?? null;
    const base: GuestPageSettingsInput = {
      ...DEFAULT_SETTINGS,
      logo_url: s?.logo_url ?? null,
      logo_size: s?.logo_size,
      logo_rounded: s?.logo_rounded,
      logo_position: s?.logo_position,
      color_primary: s?.color_primary,
      color_secondary: s?.color_secondary,
      color_background: s?.color_background,
      color_card: s?.color_card,
      color_text: s?.color_text,
      color_header: s?.color_header,
      color_button: s?.color_button,
      color_button_text: s?.color_button_text,
      color_link: s?.color_link,
      color_footer: s?.color_footer,
      font_heading: s?.font_heading,
      font_body: s?.font_body,
      font_button: s?.font_button,
      font_heading_size: s?.font_heading_size,
      font_body_size: s?.font_body_size,
      font_heading_weight: s?.font_heading_weight,
      font_body_weight: s?.font_body_weight,
      font_heading_spacing: s?.font_heading_spacing,
      font_body_spacing: s?.font_body_spacing,
      font_heading_line_height: s?.font_heading_line_height,
      font_body_line_height: s?.font_body_line_height,
      border_radius: s?.border_radius,
      background_overlay_opacity: s?.background_overlay_opacity,
      background_image: s?.background_image ?? null,
      cover_image: s?.cover_image ?? null,
      banner_height: s?.banner_height,
      welcome_message: s?.welcome_message ?? null,
      event_subtitle: s?.event_subtitle ?? null,
      card_shadow: s?.card_shadow,
      button_style: s?.button_style,
      venue_image_url: s?.venue_image_url ?? null,
      enable_schedule: s?.enable_schedule,
      enable_gallery: s?.enable_gallery,
      schedule_items: s?.schedule_items ?? [],
      gallery_images: s?.gallery_images ?? [],
    };
    setScheduleForm({
      enable_schedule: base.enable_schedule,
      schedule_items: base.schedule_items ?? [],
      enable_gallery: base.enable_gallery,
      gallery_images: base.gallery_images ?? [],
      welcome_message: base.welcome_message,
      event_subtitle: base.event_subtitle,
    });
    setSettingsForm(base);
  }, [settings]);

  // ── Derived: guest count per table ──
  const guestCountByTable = useCallback(() => {
    const map: Record<string, number> = {};
    for (const g of guests) {
      if (g.table_id) map[g.table_id] = (map[g.table_id] ?? 0) + 1;
    }
    return map;
  }, [guests]);

  const filteredGuests = guestSearch.trim()
    ? guests.filter((g) => g.name.toLowerCase().includes(guestSearch.trim().toLowerCase()))
    : guests;

  // ── Handlers: Event Details ──
  const handleDetailsChange = (field: keyof Event, value: string | boolean | null) => {
    setDetailsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = async () => {
    if (!event) return;
    setDetailsSaving(true);
    try {
      await updateEvent.mutateAsync({
        name: detailsForm.name ?? '',
        slug: detailsForm.slug ?? '',
        date: detailsForm.date ?? '',
        time: detailsForm.time ?? '',
        venue: detailsForm.venue ?? '',
        logo_url: detailsForm.logo_url ?? null,
        cover_url: detailsForm.cover_url ?? null,
        accent_color: detailsForm.accent_color ?? null,
        invitation_enabled: detailsForm.invitation_enabled ?? false,
      });
      toast('Event details saved', 'success');
    } catch {
      toast('Failed to save event details', 'error');
    } finally {
      setDetailsSaving(false);
    }
  };

  // ── Handlers: Guests ──
  const handleAddGuest = async () => {
    if (!newGuestName.trim()) {
      toast('Guest name is required', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({
        name: newGuestName.trim(),
        table_id: newGuestTableId || undefined,
      });
      toast('Guest added', 'success');
      setNewGuestName('');
      setNewGuestTableId('');
      setAddGuestOpen(false);
    } catch {
      toast('Failed to add guest', 'error');
    }
  };

  const handleBulkAddGuests = async () => {
    const names = bulkText.split('\n').map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) {
      toast('Enter at least one name', 'error');
      return;
    }
    try {
      await bulkCreateGuests.mutateAsync(names.map((name) => ({ name })));
      toast(`${names.length} guest${names.length > 1 ? 's' : ''} added`, 'success');
      setBulkText('');
      setBulkGuestOpen(false);
    } catch {
      toast('Failed to add guests', 'error');
    }
  };

  const openEditGuest = (g: GuestWithTable) => {
    setEditGuestId(g.id);
    setEditGuestName(g.name);
    setEditGuestTableId(g.table_id ?? '');
    setEditGuestOpen(true);
  };

  const handleEditGuest = async () => {
    if (!editGuestId || !editGuestName.trim()) {
      toast('Guest name is required', 'error');
      return;
    }
    try {
      await updateGuest.mutateAsync({
        id: editGuestId,
        name: editGuestName.trim(),
        table_id: editGuestTableId || null,
      });
      toast('Guest updated', 'success');
      setEditGuestOpen(false);
      setEditGuestId(null);
    } catch {
      toast('Failed to update guest', 'error');
    }
  };

  const handleDeleteGuest = async () => {
    if (!deleteGuestId) return;
    try {
      await deleteGuest.mutateAsync(deleteGuestId);
      toast('Guest deleted', 'success');
      setDeleteGuestId(null);
    } catch {
      toast('Failed to delete guest', 'error');
    }
  };

  // ── Handlers: Tables ──
  const handleAddTable = async () => {
    const num = parseInt(newTableNumber, 10);
    const cap = parseInt(newTableCapacity, 10);
    if (!newTableName.trim() || isNaN(num) || isNaN(cap)) {
      toast('Table name, number, and capacity are required', 'error');
      return;
    }
    try {
      await createTable.mutateAsync({ name: newTableName.trim(), number: num, capacity: cap });
      toast('Table added', 'success');
      setNewTableName('');
      setNewTableNumber('');
      setNewTableCapacity('');
      setAddTableOpen(false);
    } catch {
      toast('Failed to add table', 'error');
    }
  };

  const handleDeleteTable = async () => {
    if (!deleteTableId) return;
    try {
      await deleteTable.mutateAsync(deleteTableId);
      toast('Table deleted', 'success');
      setDeleteTableId(null);
    } catch {
      toast('Failed to delete table', 'error');
    }
  };

  // ── Handlers: Venue drag ──
  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDraggingId(table.id);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.current.x;
    const y = e.clientY - canvasRect.top - dragOffset.current.y;
    const card = canvasRef.current.querySelector(`[data-table-id="${draggingId}"]`) as HTMLElement | null;
    if (card) {
      card.style.left = `${Math.max(0, x)}px`;
      card.style.top = `${Math.max(0, y)}px`;
    }
  }, [draggingId]);

  const handleMouseUp = useCallback(async () => {
    if (!draggingId || !canvasRef.current) return;
    const card = canvasRef.current.querySelector(`[data-table-id="${draggingId}"]`) as HTMLElement | null;
    if (card) {
      const x = parseInt(card.style.left || '0', 10);
      const y = parseInt(card.style.top || '0', 10);
      try {
        await updateTablePosition.mutateAsync({ id: draggingId, position_x: x, position_y: y });
      } catch {
        toast('Failed to save position', 'error');
      }
    }
    setDraggingId(null);
  }, [draggingId, updateTablePosition, toast]);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  // ── Handlers: Schedule ──
  const handleScheduleChange = (field: keyof GuestPageSettingsInput, value: unknown) => {
    setScheduleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    try {
      await upsertSettings.mutateAsync(scheduleForm);
      toast('Schedule saved', 'success');
    } catch {
      toast('Failed to save schedule', 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  // ── Handlers: Settings ──
  const handleSettingsChange = (field: keyof GuestPageSettingsInput, value: unknown) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setSettingsForm((prev) => ({
      ...prev,
      color_primary: preset.primary,
      color_secondary: preset.secondary,
      color_background: preset.background,
      color_footer: preset.footer,
    }));
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await upsertSettings.mutateAsync(settingsForm);
      toast('Settings saved', 'success');
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Handler: Delete event ──
  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast('Event deleted', 'success');
      setDeleteEventOpen(false);
      // Navigate via Link after state update — use window.location for redirect
      window.location.href = '/';
    } catch {
      toast('Failed to delete event', 'error');
    }
  };

  // ── Loading / not found ──
  if (eventLoading) {
    return (
      <div className="ee-page">
        <div className="ee-loading">Loading event…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ee-page">
        <div className="ee-loading">
          <p>Event not found.</p>
          <Link to="/" className="btn btn--primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const counts = guestCountByTable();

  return (
    <div className="ee-page">
      {/* ── Event Header ── */}
      <header className="ee-header">
        <Link to="/" className="ee-back">← Back to Dashboard</Link>
        <h1 className="ee-title">{event.name}</h1>
        <p className="ee-subtitle">
          {event.date && <span>{event.date}</span>}
          {event.time && <span> · {event.time}</span>}
          {event.venue && <span> · {event.venue}</span>}
        </p>
      </header>

      {/* ── Sticky Tab Bar ── */}
      <nav className="ee-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`ee-tab${activeTab === tab.key ? ' ee-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Tab Content Area — all sections stay mounted ── */}
      <div className="ee-content">
        {/* ═══════════════ Event Details ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'details' ? ' ee-section--active' : ''}`}
          style={activeTab === 'details' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Event Details</h2>
          <div className="ee-form">
            <div className="ee-field">
              <label className="ee-label">Event Name</label>
              <input
                className="ee-input"
                type="text"
                value={detailsForm.name ?? ''}
                onChange={(e) => handleDetailsChange('name', e.target.value)}
              />
            </div>
            <div className="ee-field">
              <label className="ee-label">Slug</label>
              <input
                className="ee-input"
                type="text"
                value={detailsForm.slug ?? ''}
                onChange={(e) => handleDetailsChange('slug', e.target.value)}
              />
            </div>
            <div className="ee-row">
              <div className="ee-field">
                <label className="ee-label">Date</label>
                <input
                  className="ee-input"
                  type="date"
                  value={detailsForm.date ?? ''}
                  onChange={(e) => handleDetailsChange('date', e.target.value)}
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Time</label>
                <input
                  className="ee-input"
                  type="time"
                  value={detailsForm.time ?? ''}
                  onChange={(e) => handleDetailsChange('time', e.target.value)}
                />
              </div>
            </div>
            <div className="ee-field">
              <label className="ee-label">Venue</label>
              <input
                className="ee-input"
                type="text"
                value={detailsForm.venue ?? ''}
                onChange={(e) => handleDetailsChange('venue', e.target.value)}
              />
            </div>
            <div className="ee-field">
              <label className="ee-label">Logo URL</label>
              <input
                className="ee-input"
                type="text"
                value={detailsForm.logo_url ?? ''}
                onChange={(e) => handleDetailsChange('logo_url', e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="ee-field">
              <label className="ee-label">Cover URL</label>
              <input
                className="ee-input"
                type="text"
                value={detailsForm.cover_url ?? ''}
                onChange={(e) => handleDetailsChange('cover_url', e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="ee-field">
              <label className="ee-label">Accent Color</label>
              <div className="ee-color-row">
                <input
                  className="ee-color-picker"
                  type="color"
                  value={detailsForm.accent_color ?? '#0f766e'}
                  onChange={(e) => handleDetailsChange('accent_color', e.target.value)}
                />
                <input
                  className="ee-input ee-input--narrow"
                  type="text"
                  value={detailsForm.accent_color ?? ''}
                  onChange={(e) => handleDetailsChange('accent_color', e.target.value)}
                  placeholder="#0f766e"
                />
              </div>
            </div>
            <div className="ee-field ee-field--check">
              <label className="ee-check">
                <input
                  type="checkbox"
                  checked={detailsForm.invitation_enabled ?? false}
                  onChange={(e) => handleDetailsChange('invitation_enabled', e.target.checked)}
                />
                <span>Invitation Enabled</span>
              </label>
            </div>
            <div className="ee-actions">
              <button
                className="btn btn--primary"
                onClick={handleSaveDetails}
                disabled={detailsSaving}
                type="button"
              >
                {detailsSaving ? 'Saving…' : 'Save Details'}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════ Guests ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'guests' ? ' ee-section--active' : ''}`}
          style={activeTab === 'guests' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Guests</h2>
          <div className="ee-toolbar">
            <button className="btn btn--primary" onClick={() => setAddGuestOpen(true)} type="button">+ Add Guest</button>
            <button className="btn btn--ghost" onClick={() => setBulkGuestOpen(true)} type="button">Bulk Add</button>
            <input
              className="ee-input ee-search"
              type="text"
              placeholder="Search guests…"
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
            />
          </div>
          {guestsLoading ? (
            <p className="ee-muted">Loading guests…</p>
          ) : filteredGuests.length === 0 ? (
            <p className="ee-muted">No guests yet. Add your first guest to get started.</p>
          ) : (
            <table className="ee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Table</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((g) => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>{g.table ? `Table ${g.table.number} — ${g.table.name}` : '—'}</td>
                    <td>
                      <div className="ee-row-actions">
                        <button className="btn btn--ghost btn--sm" onClick={() => openEditGuest(g)} type="button">Edit</button>
                        <button className="btn btn--danger btn--sm" onClick={() => setDeleteGuestId(g.id)} type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add Guest Modal */}
          <Modal open={addGuestOpen} onClose={() => setAddGuestOpen(false)} title="Add Guest">
            <div className="ee-modal-form">
              <div className="ee-field">
                <label className="ee-label">Name</label>
                <input
                  className="ee-input"
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Table</label>
                <select
                  className="ee-input"
                  value={newGuestTableId}
                  onChange={(e) => setNewGuestTableId(e.target.value)}
                >
                  <option value="">— No table —</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                  ))}
                </select>
              </div>
              <div className="ee-actions">
                <button className="btn btn--ghost" onClick={() => setAddGuestOpen(false)} type="button">Cancel</button>
                <button className="btn btn--primary" onClick={handleAddGuest} type="button">Add</button>
              </div>
            </div>
          </Modal>

          {/* Bulk Add Modal */}
          <Modal open={bulkGuestOpen} onClose={() => setBulkGuestOpen(false)} title="Bulk Add Guests">
            <div className="ee-modal-form">
              <div className="ee-field">
                <label className="ee-label">Names (one per line)</label>
                <textarea
                  className="ee-textarea"
                  rows={10}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'Alice\nBob\nCharlie'}
                  autoFocus
                />
              </div>
              <div className="ee-actions">
                <button className="btn btn--ghost" onClick={() => setBulkGuestOpen(false)} type="button">Cancel</button>
                <button className="btn btn--primary" onClick={handleBulkAddGuests} type="button">Add All</button>
              </div>
            </div>
          </Modal>

          {/* Edit Guest Modal */}
          <Modal open={editGuestOpen} onClose={() => setEditGuestOpen(false)} title="Edit Guest">
            <div className="ee-modal-form">
              <div className="ee-field">
                <label className="ee-label">Name</label>
                <input
                  className="ee-input"
                  type="text"
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Table</label>
                <select
                  className="ee-input"
                  value={editGuestTableId}
                  onChange={(e) => setEditGuestTableId(e.target.value)}
                >
                  <option value="">— No table —</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>
                  ))}
                </select>
              </div>
              <div className="ee-actions">
                <button className="btn btn--ghost" onClick={() => setEditGuestOpen(false)} type="button">Cancel</button>
                <button className="btn btn--primary" onClick={handleEditGuest} type="button">Save</button>
              </div>
            </div>
          </Modal>

          <ConfirmDialog
            open={deleteGuestId !== null}
            title="Delete Guest"
            message="Are you sure you want to delete this guest? This cannot be undone."
            confirmLabel="Delete"
            onConfirm={handleDeleteGuest}
            onCancel={() => setDeleteGuestId(null)}
          />
        </section>

        {/* ═══════════════ Tables ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'tables' ? ' ee-section--active' : ''}`}
          style={activeTab === 'tables' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Tables</h2>
          <div className="ee-toolbar">
            <button className="btn btn--primary" onClick={() => setAddTableOpen(true)} type="button">+ Add Table</button>
          </div>
          {tables.length === 0 ? (
            <p className="ee-muted">No tables yet. Add your first table to get started.</p>
          ) : (
            <table className="ee-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Capacity</th>
                  <th>Guests</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.id}>
                    <td>{t.number}</td>
                    <td>{t.name}</td>
                    <td>{t.capacity}</td>
                    <td>{counts[t.id] ?? 0}</td>
                    <td>
                      <button className="btn btn--danger btn--sm" onClick={() => setDeleteTableId(t.id)} type="button">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Modal open={addTableOpen} onClose={() => setAddTableOpen(false)} title="Add Table">
            <div className="ee-modal-form">
              <div className="ee-field">
                <label className="ee-label">Name</label>
                <input
                  className="ee-input"
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="ee-row">
                <div className="ee-field">
                  <label className="ee-label">Number</label>
                  <input
                    className="ee-input"
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>
                <div className="ee-field">
                  <label className="ee-label">Capacity</label>
                  <input
                    className="ee-input"
                    type="number"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                  />
                </div>
              </div>
              <div className="ee-actions">
                <button className="btn btn--ghost" onClick={() => setAddTableOpen(false)} type="button">Cancel</button>
                <button className="btn btn--primary" onClick={handleAddTable} type="button">Add</button>
              </div>
            </div>
          </Modal>

          <ConfirmDialog
            open={deleteTableId !== null}
            title="Delete Table"
            message="Are you sure you want to delete this table? Guests assigned to it will be unassigned."
            confirmLabel="Delete"
            onConfirm={handleDeleteTable}
            onCancel={() => setDeleteTableId(null)}
          />
        </section>

        {/* ═══════════════ Venue Layout ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'venue' ? ' ee-section--active' : ''}`}
          style={activeTab === 'venue' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Venue Layout</h2>
          <div className="ee-toolbar">
            <button className="btn btn--primary" onClick={() => setAddTableOpen(true)} type="button">+ Add Table</button>
            <span className="ee-muted ee-hint">Drag table cards to position them on the floor plan.</span>
          </div>
          <div className="ee-canvas" ref={canvasRef}>
            {tables.length === 0 && (
              <p className="ee-muted ee-canvas-empty">No tables to display. Add tables from the Tables tab or the button above.</p>
            )}
            {tables.map((t) => {
              const style: CSSProperties = {
                left: t.position_x ?? 20,
                top: t.position_y ?? 20,
              };
              return (
                <div
                  key={t.id}
                  data-table-id={t.id}
                  className={`ee-venue-card${draggingId === t.id ? ' ee-venue-card--dragging' : ''}`}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, t)}
                >
                  <div className="ee-venue-card__header">
                    <span className="ee-venue-card__number">Table {t.number}</span>
                    <button
                      className="btn btn--danger btn--sm ee-venue-card__delete"
                      onClick={(e) => { e.stopPropagation(); setDeleteTableId(t.id); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                  <div className="ee-venue-card__name">{t.name}</div>
                  <div className="ee-venue-card__meta">
                    {counts[t.id] ?? 0} / {t.capacity} guests
                  </div>
                </div>
              );
            })}
          </div>

          <ConfirmDialog
            open={deleteTableId !== null}
            title="Delete Table"
            message="Are you sure you want to delete this table?"
            confirmLabel="Delete"
            onConfirm={handleDeleteTable}
            onCancel={() => setDeleteTableId(null)}
          />
        </section>

        {/* ═══════════════ Invitation ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'invitation' ? ' ee-section--active' : ''}`}
          style={activeTab === 'invitation' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Invitation</h2>
          <div className="ee-form">
            <div className="ee-field ee-field--check">
              <label className="ee-check">
                <input
                  type="checkbox"
                  checked={event.invitation_enabled}
                  onChange={(e) => handleDetailsChange('invitation_enabled', e.target.checked)}
                />
                <span>Invitation Enabled</span>
              </label>
              <p className="ee-muted ee-help">
                Toggle this to make the invitation page accessible to guests.
              </p>
            </div>
            <div className="ee-status">
              <span className={`ee-badge ${event.invitation_enabled ? 'ee-badge--on' : 'ee-badge--off'}`}>
                {event.invitation_enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="ee-field">
              <label className="ee-label">Public Invitation Page</label>
              <div className="ee-link-row">
                <Link to={`/invite/${event.slug}`} className="ee-link" target="_blank">
                  /invite/{event.slug}
                </Link>
              </div>
            </div>
            <div className="ee-field">
              <label className="ee-label">Find Your Seat Page</label>
              <div className="ee-link-row">
                <Link to={`/e/${event.slug}`} className="ee-link" target="_blank">
                  /e/{event.slug}
                </Link>
              </div>
            </div>
            <div className="ee-actions">
              <button
                className="btn btn--primary"
                onClick={handleSaveDetails}
                disabled={detailsSaving}
                type="button"
              >
                {detailsSaving ? 'Saving…' : 'Save Invitation Settings'}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════ Schedule ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'schedule' ? ' ee-section--active' : ''}`}
          style={activeTab === 'schedule' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Schedule & Gallery</h2>
          <div className="ee-form">
            <div className="ee-field ee-field--check">
              <label className="ee-check">
                <input
                  type="checkbox"
                  checked={scheduleForm.enable_schedule ?? false}
                  onChange={(e) => handleScheduleChange('enable_schedule', e.target.checked)}
                />
                <span>Enable Schedule</span>
              </label>
            </div>
            <div className="ee-field">
              <label className="ee-label">Schedule Items (JSON)</label>
              <textarea
                className="ee-textarea"
                rows={8}
                value={JSON.stringify(scheduleForm.schedule_items ?? [], null, 2)}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleScheduleChange('schedule_items', parsed);
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
                placeholder='[{"time":"18:00","title":"Ceremony","description":"Main hall"}]'
              />
            </div>
            <div className="ee-field ee-field--check">
              <label className="ee-check">
                <input
                  type="checkbox"
                  checked={scheduleForm.enable_gallery ?? false}
                  onChange={(e) => handleScheduleChange('enable_gallery', e.target.checked)}
                />
                <span>Enable Gallery</span>
              </label>
            </div>
            <div className="ee-field">
              <label className="ee-label">Gallery Images (one URL per line)</label>
              <textarea
                className="ee-textarea"
                rows={6}
                value={(scheduleForm.gallery_images ?? []).join('\n')}
                onChange={(e) => handleScheduleChange('gallery_images', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                placeholder={'https://…/photo1.jpg\nhttps://…/photo2.jpg'}
              />
            </div>
            <div className="ee-field">
              <label className="ee-label">Welcome Message</label>
              <textarea
                className="ee-textarea"
                rows={3}
                value={scheduleForm.welcome_message ?? ''}
                onChange={(e) => handleScheduleChange('welcome_message', e.target.value)}
                placeholder="Welcome to our wedding!"
              />
            </div>
            <div className="ee-field">
              <label className="ee-label">Event Subtitle</label>
              <input
                className="ee-input"
                type="text"
                value={scheduleForm.event_subtitle ?? ''}
                onChange={(e) => handleScheduleChange('event_subtitle', e.target.value)}
                placeholder="A celebration of love"
              />
            </div>
            <div className="ee-actions">
              <button
                className="btn btn--primary"
                onClick={handleSaveSchedule}
                disabled={scheduleSaving}
                type="button"
              >
                {scheduleSaving ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════ Settings ═══════════════ */}
        <section
          className={`ee-section${activeTab === 'settings' ? ' ee-section--active' : ''}`}
          style={activeTab === 'settings' ? undefined : { display: 'none' }}
        >
          <h2 className="ee-section__title">Guest Page Settings</h2>
          <div className="ee-settings-grid">
            {/* ── Controls ── */}
            <div className="ee-form">
              {/* Color Presets */}
              <h3 className="ee-group-title">Color Presets</h3>
              <div className="ee-presets">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    className="ee-preset"
                    onClick={() => handleApplyPreset(preset)}
                    type="button"
                    title={preset.name}
                  >
                    <span className="ee-preset__swatch" style={{ background: preset.primary }} />
                    <span className="ee-preset__swatch" style={{ background: preset.secondary }} />
                    <span className="ee-preset__swatch" style={{ background: preset.background }} />
                    <span className="ee-preset__swatch" style={{ background: preset.footer }} />
                    <span className="ee-preset__label">{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Colors */}
              <h3 className="ee-group-title">Colors</h3>
              <div className="ee-colors-grid">
                {([
                  ['color_primary', 'Primary'],
                  ['color_secondary', 'Secondary'],
                  ['color_background', 'Background'],
                  ['color_card', 'Card'],
                  ['color_text', 'Text'],
                  ['color_header', 'Header'],
                  ['color_button', 'Button'],
                  ['color_button_text', 'Button Text'],
                  ['color_link', 'Link'],
                  ['color_footer', 'Footer'],
                ] as [keyof GuestPageSettingsInput, string][]).map(([field, label]) => (
                  <div className="ee-field" key={field}>
                    <label className="ee-label">{label}</label>
                    <div className="ee-color-row">
                      <input
                        className="ee-color-picker"
                        type="color"
                        value={(settingsForm[field] as string) ?? '#000000'}
                        onChange={(e) => handleSettingsChange(field, e.target.value)}
                      />
                      <input
                        className="ee-input ee-input--narrow"
                        type="text"
                        value={(settingsForm[field] as string) ?? ''}
                        onChange={(e) => handleSettingsChange(field, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Fonts */}
              <h3 className="ee-group-title">Fonts</h3>
              <div className="ee-row ee-row--3">
                <div className="ee-field">
                  <label className="ee-label">Heading Font</label>
                  <select
                    className="ee-input"
                    value={settingsForm.font_heading ?? 'Inter'}
                    onChange={(e) => handleSettingsChange('font_heading', e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="ee-field">
                  <label className="ee-label">Body Font</label>
                  <select
                    className="ee-input"
                    value={settingsForm.font_body ?? 'Inter'}
                    onChange={(e) => handleSettingsChange('font_body', e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="ee-field">
                  <label className="ee-label">Button Font</label>
                  <select
                    className="ee-input"
                    value={settingsForm.font_button ?? 'Inter'}
                    onChange={(e) => handleSettingsChange('font_button', e.target.value)}
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Sizes & Weights */}
              <h3 className="ee-group-title">Typography</h3>
              <div className="ee-sliders">
                {([
                  ['font_heading_size', 'Heading Size', 12, 96],
                  ['font_body_size', 'Body Size', 10, 32],
                  ['font_heading_weight', 'Heading Weight', 100, 900],
                  ['font_body_weight', 'Body Weight', 100, 900],
                  ['font_heading_spacing', 'Heading Spacing', -5, 20],
                  ['font_body_spacing', 'Body Spacing', -5, 20],
                  ['font_heading_line_height', 'Heading Line Height', 1, 3],
                  ['font_body_line_height', 'Body Line Height', 1, 3],
                  ['border_radius', 'Border Radius', 0, 32],
                  ['background_overlay_opacity', 'Overlay Opacity', 0, 1],
                  ['banner_height', 'Banner Height', 100, 800],
                ] as [keyof GuestPageSettingsInput, string, number, number][]).map(([field, label, min, max]) => (
                  <div className="ee-field ee-field--slider" key={field}>
                    <label className="ee-label">
                      {label}: <span className="ee-slider-val">{String(settingsForm[field] ?? '')}</span>
                    </label>
                    <input
                      className="ee-slider"
                      type="range"
                      min={min}
                      max={max}
                      step={field === 'background_overlay_opacity' || field.includes('line_height') ? 0.1 : 1}
                      value={Number(settingsForm[field] ?? min)}
                      onChange={(e) => handleSettingsChange(field, parseFloat(e.target.value))}
                    />
                  </div>
                ))}
              </div>

              {/* Style Selects */}
              <h3 className="ee-group-title">Style Options</h3>
              <div className="ee-row ee-row--3">
                <div className="ee-field">
                  <label className="ee-label">Card Shadow</label>
                  <select
                    className="ee-input"
                    value={settingsForm.card_shadow ?? 'md'}
                    onChange={(e) => handleSettingsChange('card_shadow', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                <div className="ee-field">
                  <label className="ee-label">Button Style</label>
                  <select
                    className="ee-input"
                    value={settingsForm.button_style ?? 'filled'}
                    onChange={(e) => handleSettingsChange('button_style', e.target.value)}
                  >
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="ghost">Ghost</option>
                  </select>
                </div>
                <div className="ee-field">
                  <label className="ee-label">Logo Position</label>
                  <select
                    className="ee-input"
                    value={settingsForm.logo_position ?? 'center'}
                    onChange={(e) => handleSettingsChange('logo_position', e.target.value)}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div className="ee-field ee-field--check">
                <label className="ee-check">
                  <input
                    type="checkbox"
                    checked={settingsForm.logo_rounded ?? false}
                    onChange={(e) => handleSettingsChange('logo_rounded', e.target.checked)}
                  />
                  <span>Rounded Logo</span>
                </label>
              </div>

              {/* Image URLs */}
              <h3 className="ee-group-title">Images</h3>
              <div className="ee-field">
                <label className="ee-label">Logo URL</label>
                <input
                  className="ee-input"
                  type="text"
                  value={settingsForm.logo_url ?? ''}
                  onChange={(e) => handleSettingsChange('logo_url', e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Venue Image URL</label>
                <input
                  className="ee-input"
                  type="text"
                  value={settingsForm.venue_image_url ?? ''}
                  onChange={(e) => handleSettingsChange('venue_image_url', e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Background Image</label>
                <input
                  className="ee-input"
                  type="text"
                  value={settingsForm.background_image ?? ''}
                  onChange={(e) => handleSettingsChange('background_image', e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="ee-field">
                <label className="ee-label">Cover Image</label>
                <input
                  className="ee-input"
                  type="text"
                  value={settingsForm.cover_image ?? ''}
                  onChange={(e) => handleSettingsChange('cover_image', e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <div className="ee-actions">
                <button
                  className="btn btn--primary"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  type="button"
                >
                  {settingsSaving ? 'Saving…' : 'Save Settings'}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="ee-danger-zone">
                <h3 className="ee-group-title ee-group-title--danger">Danger Zone</h3>
                <button
                  className="btn btn--danger"
                  onClick={() => setDeleteEventOpen(true)}
                  type="button"
                >
                  Delete Event
                </button>
              </div>
            </div>

            {/* ── Live Preview ── */}
            <div className="ee-preview">
              <h3 className="ee-preview__title">Live Preview</h3>
              <div
                className="ee-preview__card"
                style={{
                  background: settingsForm.color_background ?? '#f8fafc',
                  color: settingsForm.color_text ?? '#0f172a',
                  fontFamily: settingsForm.font_body ?? 'Inter',
                  borderRadius: (settingsForm.border_radius ?? 16) / 2,
                }}
              >
                {/* Banner */}
                <div
                  className="ee-preview__banner"
                  style={{
                    height: Math.min(settingsForm.banner_height ?? 400, 200),
                    background: settingsForm.cover_image
                      ? `url(${settingsForm.cover_image}) center/cover`
                      : `linear-gradient(135deg, ${settingsForm.color_primary ?? '#0f766e'}, ${settingsForm.color_secondary ?? '#115e59'})`,
                    borderRadius: (settingsForm.border_radius ?? 16) / 2,
                  }}
                >
                  {settingsForm.logo_url && (
                    <img
                      src={settingsForm.logo_url}
                      alt="Logo"
                      className="ee-preview__logo"
                      style={{
                        width: Math.min(settingsForm.logo_size ?? 80, 80),
                        height: Math.min(settingsForm.logo_size ?? 80, 80),
                        borderRadius: settingsForm.logo_rounded ? '50%' : '8px',
                      }}
                    />
                  )}
                </div>
                {/* Content */}
                <div className="ee-preview__content">
                  <h2
                    className="ee-preview__heading"
                    style={{
                      fontFamily: settingsForm.font_heading ?? 'Inter',
                      fontSize: Math.min(settingsForm.font_heading_size ?? 48, 36),
                      fontWeight: settingsForm.font_heading_weight ?? 700,
                      letterSpacing: `${settingsForm.font_heading_spacing ?? 0}px`,
                      lineHeight: settingsForm.font_heading_line_height ?? 1.2,
                      color: settingsForm.color_header ?? '#ffffff',
                    }}
                  >
                    {event.name}
                  </h2>
                  {settingsForm.event_subtitle && (
                    <p className="ee-preview__subtitle">{settingsForm.event_subtitle}</p>
                  )}
                  {settingsForm.welcome_message && (
                    <p
                      className="ee-preview__welcome"
                      style={{
                        fontSize: Math.min(settingsForm.font_body_size ?? 16, 16),
                        lineHeight: settingsForm.font_body_line_height ?? 1.5,
                      }}
                    >
                      {settingsForm.welcome_message}
                    </p>
                  )}
                  {/* Card */}
                  <div
                    className="ee-preview__inner-card"
                    style={{
                      background: settingsForm.color_card ?? '#ffffff',
                      borderRadius: (settingsForm.border_radius ?? 16) / 2,
                      boxShadow: shadowFor(settingsForm.card_shadow ?? 'md'),
                    }}
                  >
                    <p className="ee-preview__label">Find Your Seat</p>
                    <button
                      style={{
                        background: settingsForm.button_style === 'outline' || settingsForm.button_style === 'ghost'
                          ? 'transparent'
                          : settingsForm.color_button ?? '#0f766e',
                        color: settingsForm.color_button_text ?? '#ffffff',
                        border: settingsForm.button_style === 'outline'
                          ? `2px solid ${settingsForm.color_button ?? '#0f766e'}`
                          : 'none',
                        borderRadius: (settingsForm.border_radius ?? 16) / 3,
                        fontFamily: settingsForm.font_button ?? 'Inter',
                      }}
                      className="ee-preview__btn"
                      type="button"
                    >
                      Search
                    </button>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="ee-preview__link"
                      style={{ color: settingsForm.color_link ?? '#0f766e' }}
                    >
                      View invitation →
                    </a>
                  </div>
                  {/* Footer */}
                  <div
                    className="ee-preview__footer"
                    style={{
                      background: settingsForm.color_footer ?? '#0f172a',
                      borderRadius: (settingsForm.border_radius ?? 16) / 3,
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>Made with Seatly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ConfirmDialog
            open={deleteEventOpen}
            title="Delete Event"
            message="Are you sure you want to delete this event? All guests, tables, and settings will be permanently removed. This cannot be undone."
            confirmLabel="Delete Event"
            onConfirm={handleDeleteEvent}
            onCancel={() => setDeleteEventOpen(false)}
          />
        </section>
      </div>
    </div>
  );
}

// ── Helpers ──

function shadowFor(level: string): string {
  switch (level) {
    case 'none': return 'none';
    case 'sm': return '0 1px 2px rgba(0,0,0,0.08)';
    case 'lg': return '0 12px 32px rgba(0,0,0,0.16)';
    case 'md':
    default: return '0 4px 12px rgba(0,0,0,0.12)';
  }
}
