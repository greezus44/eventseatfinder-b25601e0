import { useState, useRef, useCallback, useMemo, useEffect, type ChangeEvent, type DragEvent } from 'react';
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

/* ---------- helpers ---------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function darken(hex: string, amount = 0.2): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
}

function contrastText(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55 ? '#0f172a' : '#ffffff';
}

function deriveFromPrimary(primary: string) {
  return {
    color_link: primary,
    color_secondary: darken(primary, 0.2),
    color_footer: darken('#0f172a', 0),
    color_button_text: contrastText(primary),
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/* ---------- main component ---------- */

export function EventEditorPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('details');

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const deleteEvent = useDeleteEvent();

  const { data: guests, isLoading: guestsLoading } = useGuests(eventId);
  const createGuest = useCreateGuest(eventId);
  const bulkCreateGuests = useBulkCreateGuests(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const deleteGuest = useDeleteGuest(eventId);

  const { data: tables } = useTables(eventId);
  const createTable = useCreateTable(eventId);
  const deleteTable = useDeleteTable(eventId);

  const { data: settings } = useGuestPageSettings(eventId);
  const upsertSettings = useUpsertGuestPageSettings(eventId);

  if (eventLoading) {
    return <div className="ee-loading">Loading event…</div>;
  }
  if (!event) {
    return <div className="ee-loading">Event not found.</div>;
  }

  return (
    <div className="ee-page">
      <EventHeader event={event} />
      <div className="ee-tabs">
        <div className="ee-tabs__inner">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`ee-tab${activeTab === t.key ? ' ee-tab--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ee-content">
        <div className={`ee-section${activeTab === 'details' ? ' ee-section--active' : ''}`}>
          <EventDetailsSection event={event} onSave={updateEvent.mutateAsync} />
        </div>
        <div className={`ee-section${activeTab === 'guests' ? ' ee-section--active' : ''}`}>
          <GuestsSection
            guests={guests ?? []}
            guestsLoading={guestsLoading}
            tables={tables ?? []}
            createGuest={createGuest.mutateAsync}
            bulkCreateGuests={bulkCreateGuests.mutateAsync}
            updateGuest={updateGuest.mutateAsync}
            deleteGuest={deleteGuest.mutateAsync}
          />
        </div>
        <div className={`ee-section${activeTab === 'tables' ? ' ee-section--active' : ''}`}>
          <TablesSection
            tables={tables ?? []}
            guests={guests ?? []}
            createTable={createTable.mutateAsync}
            deleteTable={deleteTable.mutateAsync}
          />
        </div>
        <div className={`ee-section${activeTab === 'venue' ? ' ee-section--active' : ''}`}>
          <VenueLayoutSection
            venueImageUrl={settings?.venue_image_url ?? null}
            upsertSettings={upsertSettings.mutateAsync}
          />
        </div>
        <div className={`ee-section${activeTab === 'invitation' ? ' ee-section--active' : ''}`}>
          <InvitationSection event={event} onSave={updateEvent.mutateAsync} />
        </div>
        <div className={`ee-section${activeTab === 'schedule' ? ' ee-section--active' : ''}`}>
          <ScheduleSection settings={settings} upsertSettings={upsertSettings.mutateAsync} />
        </div>
        <div className={`ee-section${activeTab === 'settings' ? ' ee-section--active' : ''}`}>
          <SettingsSection
            event={event}
            settings={settings}
            upsertSettings={upsertSettings.mutateAsync}
            deleteEvent={deleteEvent.mutateAsync}
            onDeleted={() => navigate('/')}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- event header ---------- */

function EventHeader({ event }: { event: Event }) {
  return (
    <div className="ee-header">
      <Link to="/" className="ee-header__back">← Back to Dashboard</Link>
      <h1 className="ee-header__title">{event.name}</h1>
      <p className="ee-header__subtitle">
        {[event.date && formatDate(event.date), event.time, event.venue].filter(Boolean).join(' · ') || 'No date or venue set'}
      </p>
    </div>
  );
}

function formatDate(d: string): string {
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
}

/* ---------- event details section ---------- */

function EventDetailsSection({ event, onSave }: { event: Event; onSave: (v: Partial<Event>) => Promise<unknown> }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: event.name,
    slug: event.slug,
    date: event.date,
    time: event.time,
    venue: event.venue,
    logo_url: event.logo_url ?? '',
    cover_url: event.cover_url ?? '',
    accent_color: event.accent_color ?? '#0f766e',
    invitation_enabled: event.invitation_enabled,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        slug: form.slug,
        date: form.date,
        time: form.time,
        venue: form.venue,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        accent_color: form.accent_color,
        invitation_enabled: form.invitation_enabled,
      });
      toast('Event details saved', 'success');
    } catch (e) {
      toast('Failed to save event details', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ee-panel">
      <h2 className="ee-panel__title">Event Details</h2>
      <div className="ee-form-grid">
        <label className="ee-field">
          <span className="ee-field__label">Event Name</span>
          <input className="ee-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="ee-field">
          <span className="ee-field__label">Slug</span>
          <input className="ee-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </label>
        <label className="ee-field">
          <span className="ee-field__label">Date</span>
          <input className="ee-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="ee-field">
          <span className="ee-field__label">Time</span>
          <input className="ee-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </label>
        <label className="ee-field ee-field--full">
          <span className="ee-field__label">Venue</span>
          <input className="ee-input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
        </label>
        <label className="ee-field ee-field--full">
          <span className="ee-field__label">Logo URL</span>
          <input className="ee-input" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
        </label>
        <label className="ee-field ee-field--full">
          <span className="ee-field__label">Cover Image URL</span>
          <input className="ee-input" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" />
        </label>
        <label className="ee-field">
          <span className="ee-field__label">Accent Colour</span>
          <div className="ee-color-row">
            <input type="color" className="ee-color-input" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
            <input className="ee-input ee-input--hex" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} />
          </div>
        </label>
        <label className="ee-field ee-field--check">
          <input type="checkbox" checked={form.invitation_enabled} onChange={(e) => setForm({ ...form, invitation_enabled: e.target.checked })} />
          <span className="ee-field__label">Invitation Enabled</span>
        </label>
      </div>
      <div className="ee-actions">
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Details'}</button>
      </div>
    </div>
  );
}

/* ---------- guests section ---------- */

interface GuestsSectionProps {
  guests: GuestWithTable[];
  guestsLoading: boolean;
  tables: { id: string; name: string; number: number; capacity: number }[];
  createGuest: (v: { name: string; table_id?: string | null }) => Promise<unknown>;
  bulkCreateGuests: (v: { name: string; table_id?: string | null }[]) => Promise<unknown>;
  updateGuest: (v: { id: string; name?: string; table_id?: string | null }) => Promise<unknown>;
  deleteGuest: (id: string) => Promise<unknown>;
}

function GuestsSection(props: GuestsSectionProps) {
  const { guests, guestsLoading, tables, createGuest, bulkCreateGuests, updateGuest, deleteGuest } = props;
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<GuestWithTable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // add form
  const [newName, setNewName] = useState('');
  const [newTable, setNewTable] = useState('');

  // bulk form
  const [bulkText, setBulkText] = useState('');

  // edit form
  const [editName, setEditName] = useState('');
  const [editTable, setEditTable] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, search]);

  const handleAdd = async () => {
    if (!newName.trim()) { toast('Name is required', 'error'); return; }
    try {
      await createGuest({ name: newName.trim(), table_id: newTable || null });
      toast('Guest added', 'success');
      setAddOpen(false); setNewName(''); setNewTable('');
    } catch { toast('Failed to add guest', 'error'); }
  };

  const handleBulk = async () => {
    const names = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!names.length) { toast('Enter at least one name', 'error'); return; }
    try {
      await bulkCreateGuests(names.map((n) => ({ name: n })));
      toast(`${names.length} guest${names.length > 1 ? 's' : ''} added`, 'success');
      setBulkOpen(false); setBulkText('');
    } catch { toast('Failed to add guests', 'error'); }
  };

  const openEdit = (g: GuestWithTable) => {
    setEditGuest(g);
    setEditName(g.name);
    setEditTable(g.table_id ?? '');
    setEditOpen(true);
  };
  const [editOpen, setEditOpen] = useState(false);

  const handleEdit = async () => {
    if (!editGuest) return;
    if (!editName.trim()) { toast('Name is required', 'error'); return; }
    try {
      await updateGuest({ id: editGuest.id, name: editName.trim(), table_id: editTable || null });
      toast('Guest updated', 'success');
      setEditOpen(false); setEditGuest(null);
    } catch { toast('Failed to update guest', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGuest(deleteId);
      toast('Guest deleted', 'success');
    } catch { toast('Failed to delete guest', 'error'); } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="ee-panel">
      <div className="ee-panel__header">
        <h2 className="ee-panel__title">Guests</h2>
        <div className="ee-panel__actions">
          <button className="btn btn--primary" onClick={() => setAddOpen(true)}>+ Add Guest</button>
          <button className="btn btn--ghost" onClick={() => setBulkOpen(true)}>Bulk Add</button>
        </div>
      </div>

      <input className="ee-input ee-input--search" placeholder="Search guests…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {guestsLoading ? (
        <p className="ee-empty">Loading guests…</p>
      ) : filtered.length === 0 ? (
        <p className="ee-empty">{search ? 'No guests match your search.' : 'No guests yet. Add your first guest.'}</p>
      ) : (
        <div className="ee-table-wrap">
          <table className="ee-table">
            <thead>
              <tr><th>Name</th><th>Table</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.table ? `Table ${g.table.number} — ${g.table.name}` : '—'}</td>
                  <td className="ee-table__actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(g)}>Edit</button>
                    <button className="btn btn--danger btn--sm" onClick={() => setDeleteId(g.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Guest">
        <div className="ee-modal-form">
          <label className="ee-field">
            <span className="ee-field__label">Name</span>
            <input className="ee-input" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} autoFocus />
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Table (optional)</span>
            <select className="ee-input" value={newTable} onChange={(e) => setNewTable(e.target.value)}>
              <option value="">No table</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>)}
            </select>
          </label>
          <div className="ee-actions">
            <button className="btn btn--ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn--primary" onClick={handleAdd}>Add Guest</button>
          </div>
        </div>
      </Modal>

      {/* Bulk modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Add Guests">
        <div className="ee-modal-form">
          <label className="ee-field">
            <span className="ee-field__label">Guest Names (one per line)</span>
            <textarea className="ee-textarea" rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={'Alice\nBob\nCharlie'} autoFocus />
          </label>
          <div className="ee-actions">
            <button className="btn btn--ghost" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button className="btn btn--primary" onClick={handleBulk}>Add All</button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditGuest(null); }} title="Edit Guest">
        <div className="ee-modal-form">
          <label className="ee-field">
            <span className="ee-field__label">Name</span>
            <input className="ee-input" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Table</span>
            <select className="ee-input" value={editTable} onChange={(e) => setEditTable(e.target.value)}>
              <option value="">No table</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Table {t.number} — {t.name}</option>)}
            </select>
          </label>
          <div className="ee-actions">
            <button className="btn btn--ghost" onClick={() => { setEditOpen(false); setEditGuest(null); }}>Cancel</button>
            <button className="btn btn--primary" onClick={handleEdit}>Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Guest"
        message="Are you sure you want to delete this guest? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

/* ---------- tables section ---------- */

interface TablesSectionProps {
  tables: { id: string; name: string; number: number; capacity: number }[];
  guests: GuestWithTable[];
  createTable: (v: { name: string; number: number; capacity: number }) => Promise<unknown>;
  deleteTable: (id: string) => Promise<unknown>;
}

function TablesSection(props: TablesSectionProps) {
  const { tables, guests, createTable, deleteTable } = props;
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', number: 1, capacity: 8 });

  const guestCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of guests) {
      if (g.table_id) map[g.table_id] = (map[g.table_id] ?? 0) + 1;
    }
    return map;
  }, [guests]);

  const handleAdd = async () => {
    if (!form.name.trim()) { toast('Table name is required', 'error'); return; }
    try {
      await createTable({ name: form.name.trim(), number: form.number, capacity: form.capacity });
      toast('Table added', 'success');
      setAddOpen(false);
      setForm({ name: '', number: (tables.length ?? 0) + 1, capacity: 8 });
    } catch { toast('Failed to add table', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTable(deleteId);
      toast('Table deleted', 'success');
    } catch { toast('Failed to delete table', 'error'); } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="ee-panel">
      <div className="ee-panel__header">
        <h2 className="ee-panel__title">Tables</h2>
        <div className="ee-panel__actions">
          <button className="btn btn--primary" onClick={() => { setForm({ name: '', number: (tables.length ?? 0) + 1, capacity: 8 }); setAddOpen(true); }}>+ Add Table</button>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="ee-empty">No tables yet. Add your first table.</p>
      ) : (
        <div className="ee-table-wrap">
          <table className="ee-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Capacity</th><th>Guests</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id}>
                  <td>{t.number}</td>
                  <td>{t.name}</td>
                  <td>{t.capacity}</td>
                  <td>{guestCount[t.id] ?? 0}</td>
                  <td className="ee-table__actions">
                    <button className="btn btn--danger btn--sm" onClick={() => setDeleteId(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Table">
        <div className="ee-modal-form">
          <label className="ee-field">
            <span className="ee-field__label">Table Name</span>
            <input className="ee-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Table Number</span>
            <input className="ee-input" type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} />
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Capacity</span>
            <input className="ee-input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </label>
          <div className="ee-actions">
            <button className="btn btn--ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn--primary" onClick={handleAdd}>Add Table</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Table"
        message="Are you sure you want to delete this table? Guests assigned to it will become unassigned."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

/* ---------- venue layout section (image upload) ---------- */

function VenueLayoutSection({
  venueImageUrl,
  upsertSettings,
}: {
  venueImageUrl: string | null;
  upsertSettings: (v: GuestPageSettingsInput) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast('Unsupported format. Use PNG, JPG, JPEG, or WebP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('File too large. Maximum size is 5MB.', 'error');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await upsertSettings({ venue_image_url: dataUrl });
      toast('Venue layout image saved', 'success');
    } catch {
      toast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  }, [upsertSettings, toast]);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setDragOver(false); };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await upsertSettings({ venue_image_url: null });
      toast('Venue layout image removed', 'success');
    } catch {
      toast('Failed to remove image', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ee-panel">
      <h2 className="ee-panel__title">Venue Layout</h2>

      {!venueImageUrl ? (
        <div
          className={`ee-dropzone${dragOver ? ' ee-dropzone--over' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={onInputChange}
            style={{ display: 'none' }}
          />
          <div className="ee-dropzone__icon">🖼️</div>
          <p className="ee-dropzone__text">Drag &amp; drop your venue layout image here</p>
          <p className="ee-dropzone__subtext">or</p>
          <button className="btn btn--primary" type="button" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Click to Browse'}
          </button>
          <p className="ee-dropzone__formats">Supported formats: PNG, JPG, JPEG, WebP (max 5MB)</p>
        </div>
      ) : (
        <div className="ee-venue-preview">
          <div className="ee-venue-preview__image-wrap">
            <img src={venueImageUrl} alt="Venue layout" className="ee-venue-preview__img" />
          </div>
          <div className="ee-venue-preview__actions">
            <button className="btn btn--ghost" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Replace Image'}
            </button>
            <button className="btn btn--danger" onClick={handleRemove} disabled={uploading}>
              Remove Image
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={onInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- invitation section ---------- */

function InvitationSection({ event, onSave }: { event: Event; onSave: (v: Partial<Event>) => Promise<unknown> }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(event.invitation_enabled);
  const [saving, setSaving] = useState(false);

  // keep in sync if event changes
  useEffect(() => { setEnabled(event.invitation_enabled); }, [event.invitation_enabled]);

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      await onSave({ invitation_enabled: next });
      toast(next ? 'Invitations enabled' : 'Invitations disabled', 'success');
    } catch {
      setEnabled(!next);
      toast('Failed to update invitation setting', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ee-panel">
      <h2 className="ee-panel__title">Invitation</h2>

      <div className="ee-invite-toggle">
        <label className="ee-field ee-field--check">
          <input type="checkbox" checked={enabled} onChange={handleToggle} disabled={saving} />
          <span className="ee-field__label">Enable public invitation page</span>
        </label>
      </div>

      <div className={`ee-invite-status${enabled ? ' ee-invite-status--on' : ' ee-invite-status--off'}`}>
        {enabled ? 'Invitations are currently enabled.' : 'Invitations are currently disabled.'}
      </div>

      <div className="ee-invite-links">
        <div className="ee-invite-link-row">
          <span className="ee-invite-link-row__label">Invitation Page</span>
          <Link to={`/invite/${event.slug}`} className="ee-invite-link" target="_blank" rel="noopener noreferrer">/invite/{event.slug}</Link>
        </div>
        <div className="ee-invite-link-row">
          <span className="ee-invite-link-row__label">Find Your Seat</span>
          <Link to={`/e/${event.slug}`} className="ee-invite-link" target="_blank" rel="noopener noreferrer">/e/{event.slug}</Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- schedule section ---------- */

interface ScheduleSectionProps {
  settings: { schedule_items: unknown[] | null; gallery_images: string[] | null; welcome_message: string | null; event_subtitle: string | null; enable_schedule: boolean; enable_gallery: boolean } | null | undefined;
  upsertSettings: (v: GuestPageSettingsInput) => Promise<unknown>;
}

function ScheduleSection(props: ScheduleSectionProps) {
  const { settings, upsertSettings } = props;
  const { toast } = useToast();

  const [enableSchedule, setEnableSchedule] = useState(settings?.enable_schedule ?? false);
  const [enableGallery, setEnableGallery] = useState(settings?.enable_gallery ?? false);
  const [scheduleText, setScheduleText] = useState(() => {
    try {
      return settings?.schedule_items ? JSON.stringify(settings.schedule_items, null, 2) : '[]';
    } catch { return '[]'; }
  });
  const [galleryText, setGalleryText] = useState((settings?.gallery_images ?? []).join('\n'));
  const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcome_message ?? '');
  const [subtitle, setSubtitle] = useState(settings?.event_subtitle ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let scheduleItems: unknown[];
      try {
        scheduleItems = JSON.parse(scheduleText);
      } catch {
        toast('Schedule items is not valid JSON', 'error');
        setSaving(false);
        return;
      }
      const galleryImages = galleryText.split('\n').map((l) => l.trim()).filter(Boolean);
      await upsertSettings({
        enable_schedule: enableSchedule,
        enable_gallery: enableGallery,
        schedule_items: scheduleItems,
        gallery_images: galleryImages,
        welcome_message: welcomeMessage || null,
        event_subtitle: subtitle || null,
      });
      toast('Schedule settings saved', 'success');
    } catch {
      toast('Failed to save schedule settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ee-panel">
      <h2 className="ee-panel__title">Schedule &amp; Gallery</h2>

      <label className="ee-field ee-field--check">
        <input type="checkbox" checked={enableSchedule} onChange={(e) => setEnableSchedule(e.target.checked)} />
        <span className="ee-field__label">Enable Schedule</span>
      </label>

      <label className="ee-field">
        <span className="ee-field__label">Schedule Items (JSON array)</span>
        <textarea className="ee-textarea" rows={10} value={scheduleText} onChange={(e) => setScheduleText(e.target.value)} placeholder='[{"time":"18:00","title":"Doors Open"}]' />
      </label>

      <label className="ee-field ee-field--check">
        <input type="checkbox" checked={enableGallery} onChange={(e) => setEnableGallery(e.target.checked)} />
        <span className="ee-field__label">Enable Gallery</span>
      </label>

      <label className="ee-field">
        <span className="ee-field__label">Gallery Images (one URL per line)</span>
        <textarea className="ee-textarea" rows={6} value={galleryText} onChange={(e) => setGalleryText(e.target.value)} placeholder={'https://…\nhttps://…'} />
      </label>

      <label className="ee-field">
        <span className="ee-field__label">Welcome Message</span>
        <textarea className="ee-textarea" rows={4} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Welcome to our event…" />
      </label>

      <label className="ee-field">
        <span className="ee-field__label">Event Subtitle</span>
        <input className="ee-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A subtitle shown on the guest page" />
      </label>

      <div className="ee-actions">
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Schedule'}</button>
      </div>
    </div>
  );
}

/* ---------- settings section (theme editor) ---------- */

interface SettingsSectionProps {
  event: Event;
  settings: {
    logo_url: string | null;
    cover_image: string | null;
    color_primary: string;
    color_background: string;
    color_card: string;
    color_text: string;
    color_header: string;
    color_button: string;
    color_button_text: string;
    color_link: string;
    color_footer: string;
    color_secondary: string;
    font_heading: string;
    font_body: string;
    event_subtitle: string | null;
    welcome_message: string | null;
  } | null | undefined;
  upsertSettings: (v: GuestPageSettingsInput) => Promise<unknown>;
  deleteEvent: (id: string) => Promise<unknown>;
  onDeleted: () => void;
}

function SettingsSection(props: SettingsSectionProps) {
  const { event, settings, upsertSettings, deleteEvent, onDeleted } = props;
  const { toast } = useToast();

  // Build initial form from settings or defaults
  const initial = useMemo(() => ({
    logo_url: settings?.logo_url ?? DEFAULT_SETTINGS.logo_url ?? '',
    cover_image: settings?.cover_image ?? DEFAULT_SETTINGS.cover_image ?? '',
    color_primary: settings?.color_primary ?? DEFAULT_SETTINGS.color_primary!,
    color_background: settings?.color_background ?? DEFAULT_SETTINGS.color_background!,
    color_card: settings?.color_card ?? DEFAULT_SETTINGS.color_card!,
    color_text: settings?.color_text ?? DEFAULT_SETTINGS.color_text!,
    color_header: settings?.color_header ?? DEFAULT_SETTINGS.color_header!,
    color_button: settings?.color_button ?? DEFAULT_SETTINGS.color_button!,
    color_button_text: settings?.color_button_text ?? DEFAULT_SETTINGS.color_button_text!,
    color_link: settings?.color_link ?? DEFAULT_SETTINGS.color_link!,
    color_footer: settings?.color_footer ?? DEFAULT_SETTINGS.color_footer!,
    color_secondary: settings?.color_secondary ?? DEFAULT_SETTINGS.color_secondary!,
    font_heading: settings?.font_heading ?? DEFAULT_SETTINGS.font_heading!,
    font_body: settings?.font_body ?? DEFAULT_SETTINGS.font_body!,
  }), [settings]);

  const [form, setForm] = useState(initial);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync if settings load later
  useEffect(() => { setForm(initial); }, [initial]);

  const applyPreset = (preset: typeof THEME_PRESETS[number]) => {
    setForm((prev) => ({
      ...prev,
      color_primary: preset.color_primary,
      color_background: preset.color_background,
      color_card: preset.color_card,
      color_text: preset.color_text,
      color_button: preset.color_button,
      color_button_text: preset.color_button_text,
      color_link: preset.color_link,
      color_footer: preset.color_footer,
      color_secondary: darken(preset.color_primary, 0.2),
      color_header: preset.color_background,
      font_heading: preset.font_heading,
      font_body: preset.font_body,
    }));
  };

  const updatePrimary = (hex: string) => {
    const derived = deriveFromPrimary(hex);
    setForm((prev) => ({
      ...prev,
      color_primary: hex,
      color_link: derived.color_link,
      color_secondary: derived.color_secondary,
      color_footer: derived.color_footer,
      color_button_text: derived.color_button_text,
      color_header: prev.color_background,
    }));
  };

  const updateBackground = (hex: string) => {
    setForm((prev) => ({
      ...prev,
      color_background: hex,
      color_header: hex,
      color_card: isLight(hex) ? '#ffffff' : '#1e293b',
      color_text: isLight(hex) ? '#0f172a' : '#f1f5f9',
    }));
  };

  const updateButton = (hex: string) => {
    setForm((prev) => ({
      ...prev,
      color_button: hex,
      color_button_text: contrastText(hex),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertSettings({
        logo_url: form.logo_url || null,
        cover_image: form.cover_image || null,
        color_primary: form.color_primary,
        color_background: form.color_background,
        color_card: form.color_card,
        color_text: form.color_text,
        color_header: form.color_header,
        color_button: form.color_button,
        color_button_text: form.color_button_text,
        color_link: form.color_link,
        color_footer: form.color_footer,
        color_secondary: form.color_secondary,
        font_heading: form.font_heading,
        font_body: form.font_body,
      });
      toast('Theme settings saved', 'success');
    } catch {
      toast('Failed to save theme settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(event.id);
      toast('Event deleted', 'success');
      onDeleted();
    } catch {
      toast('Failed to delete event', 'error');
    }
  };

  return (
    <div className="ee-settings-grid">
      {/* left column: editor */}
      <div className="ee-settings-editor">
        {/* Theme presets */}
        <div className="ee-panel">
          <h2 className="ee-panel__title">Theme Presets</h2>
          <div className="ee-presets">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.name}
                className={`ee-preset${form.color_primary === p.color_primary && form.font_heading === p.font_heading ? ' ee-preset--active' : ''}`}
                onClick={() => applyPreset(p)}
                type="button"
              >
                <span className="ee-preset__swatches">
                  <span className="ee-preset__swatch" style={{ background: p.color_primary }} />
                  <span className="ee-preset__swatch" style={{ background: p.color_background }} />
                  <span className="ee-preset__swatch" style={{ background: p.color_button }} />
                </span>
                <span className="ee-preset__name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div className="ee-panel">
          <h2 className="ee-panel__title">Branding</h2>
          <label className="ee-field">
            <span className="ee-field__label">Event Logo URL</span>
            <input className="ee-input" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Cover Image URL</span>
            <input className="ee-input" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://…" />
          </label>
        </div>

        {/* Colours */}
        <div className="ee-panel">
          <h2 className="ee-panel__title">Colours</h2>
          <label className="ee-field">
            <span className="ee-field__label">Primary / Accent</span>
            <div className="ee-color-row">
              <input type="color" className="ee-color-input" value={form.color_primary} onChange={(e) => updatePrimary(e.target.value)} />
              <input className="ee-input ee-input--hex" value={form.color_primary} onChange={(e) => updatePrimary(e.target.value)} />
            </div>
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Background</span>
            <div className="ee-color-row">
              <input type="color" className="ee-color-input" value={form.color_background} onChange={(e) => updateBackground(e.target.value)} />
              <input className="ee-input ee-input--hex" value={form.color_background} onChange={(e) => updateBackground(e.target.value)} />
            </div>
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Button</span>
            <div className="ee-color-row">
              <input type="color" className="ee-color-input" value={form.color_button} onChange={(e) => updateButton(e.target.value)} />
              <input className="ee-input ee-input--hex" value={form.color_button} onChange={(e) => updateButton(e.target.value)} />
            </div>
          </label>
        </div>

        {/* Fonts */}
        <div className="ee-panel">
          <h2 className="ee-panel__title">Fonts</h2>
          <label className="ee-field">
            <span className="ee-field__label">Heading Font</span>
            <select
              className="ee-input"
              value={form.font_heading}
              onChange={(e) => setForm({ ...form, font_heading: e.target.value })}
              style={{ fontFamily: form.font_heading }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </label>
          <label className="ee-field">
            <span className="ee-field__label">Body Font</span>
            <select
              className="ee-input"
              value={form.font_body}
              onChange={(e) => setForm({ ...form, font_body: e.target.value })}
              style={{ fontFamily: form.font_body }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="ee-actions">
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Theme'}</button>
        </div>

        {/* Danger zone */}
        <div className="ee-panel ee-panel--danger">
          <h2 className="ee-panel__title">Danger Zone</h2>
          <p className="ee-danger-text">Deleting an event permanently removes it along with all guests, tables, and settings.</p>
          <button className="btn btn--danger" onClick={() => setDeleteOpen(true)}>Delete Event</button>
        </div>
      </div>

      {/* right column: live preview (sticky) */}
      <div className="ee-preview-wrap">
        <div className="ee-preview-toolbar">
          <button
            className={`ee-preview-toggle${previewDevice === 'desktop' ? ' ee-preview-toggle--active' : ''}`}
            onClick={() => setPreviewDevice('desktop')}
            type="button"
          >Desktop</button>
          <button
            className={`ee-preview-toggle${previewDevice === 'mobile' ? ' ee-preview-toggle--active' : ''}`}
            onClick={() => setPreviewDevice('mobile')}
            type="button"
          >Mobile</button>
        </div>
        <div className="ee-preview-scroll">
          <div
            className="ee-preview"
            style={{
              width: previewDevice === 'desktop' ? '100%' : '375px',
              maxWidth: '100%',
              margin: '0 auto',
              background: form.color_background,
              fontFamily: form.font_body,
              color: form.color_text,
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Banner */}
            <div
              className="ee-preview__banner"
              style={{
                height: '180px',
                background: form.cover_image
                  ? `url(${form.cover_image}) center/cover`
                  : `linear-gradient(135deg, ${form.color_primary}, ${form.color_secondary})`,
              }}
            >
              {form.logo_url && (
                <img
                  src={form.logo_url}
                  alt="logo"
                  className="ee-preview__logo"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
                />
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h3
                className="ee-preview__heading"
                style={{ fontFamily: form.font_heading, color: form.color_text, fontSize: 28, margin: '0 0 8px' }}
              >
                {event.name}
              </h3>
              {settings?.event_subtitle && (
                <p style={{ color: form.color_text, opacity: 0.7, margin: '0 0 12px', fontSize: 14 }}>
                  {settings.event_subtitle}
                </p>
              )}
              <p style={{ color: form.color_text, opacity: 0.8, margin: '0 0 20px', fontSize: 14, lineHeight: 1.5 }}>
                {settings?.welcome_message || 'Welcome to our event. We are glad you could join us.'}
              </p>

              {/* Card */}
              <div
                style={{
                  background: form.color_card,
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '0 0 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  textAlign: 'left',
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: 14, color: form.color_text }}>
                  Find your seat at the event.
                </p>
                <button
                  style={{
                    background: form.color_button,
                    color: form.color_button_text,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontFamily: form.font_body,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Find Your Seat
                </button>
                <div style={{ marginTop: '12px' }}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ color: form.color_link, fontFamily: form.font_body, fontSize: 14, textDecoration: 'underline' }}
                  >
                    View invitation details
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                background: form.color_footer,
                color: contrastText(form.color_footer),
                padding: '16px',
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              {event.name} · {event.venue || 'Venue TBA'}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Event"
        message={`Are you sure you want to delete "${event.name}"? This will permanently remove all guests, tables, and settings. This cannot be undone.`}
        confirmLabel="Delete Event"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function isLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55;
}

/* ---------- inline styles for ee- classes (injected once) ---------- */

const STYLE_ID = 'ee-event-editor-styles';
function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.ee-page { max-width: 1100px; margin: 0 auto; padding: 0 24px 80px; }
.ee-loading { padding: 80px 24px; text-align: center; color: #64748b; font-size: 16px; }

.ee-header { padding: 32px 0 24px; }
.ee-header__back { display: inline-block; color: #0f766e; text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 12px; }
.ee-header__back:hover { text-decoration: underline; }
.ee-header__title { font-size: 32px; font-weight: 700; margin: 0 0 4px; color: #0f172a; }
.ee-header__subtitle { font-size: 15px; color: #64748b; margin: 0; }

.ee-tabs { position: sticky; top: 0; z-index: 20; background: #ffffff; border-bottom: 1px solid #e2e8f0; margin: 0 -24px 24px; padding: 0 24px; }
.ee-tabs__inner { display: flex; gap: 8px; padding: 12px 0; overflow-x: auto; scrollbar-width: none; }
.ee-tabs__inner::-webkit-scrollbar { display: none; }
.ee-tab { flex-shrink: 0; padding: 8px 18px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; border-radius: 999px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.ee-tab:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }
.ee-tab--active { background: #0f766e; color: #fff; border-color: #0f766e; box-shadow: 0 2px 8px rgba(15,118,110,0.25); }
.ee-tab--active:hover { background: #115e59; border-color: #115e59; }

.ee-content { min-height: 400px; }
.ee-section { display: none; }
.ee-section--active { display: block; animation: ee-fade 0.2s ease; }
@keyframes ee-fade { from { opacity: 0; } to { opacity: 1; } }

.ee-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 24px; }
.ee-panel--danger { border-color: #fecaca; }
.ee-panel__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
.ee-panel__title { font-size: 20px; font-weight: 600; margin: 0 0 20px; color: #0f172a; }
.ee-panel__header .ee-panel__title { margin: 0; }
.ee-panel__actions { display: flex; gap: 8px; flex-wrap: wrap; }

.ee-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.ee-field { display: flex; flex-direction: column; gap: 6px; }
.ee-field--full { grid-column: 1 / -1; }
.ee-field--check { flex-direction: row; align-items: center; gap: 10px; }
.ee-field__label { font-size: 14px; font-weight: 500; color: #334155; }
.ee-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #fff; color: #0f172a; transition: border-color 0.15s, box-shadow 0.15s; }
.ee-input:focus { outline: none; border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.12); }
.ee-input--search { max-width: 360px; margin-bottom: 20px; }
.ee-input--hex { flex: 1; font-family: monospace; }
.ee-textarea { padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; font-family: monospace; resize: vertical; background: #fff; color: #0f172a; }
.ee-textarea:focus { outline: none; border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.12); }
.ee-color-row { display: flex; gap: 8px; align-items: center; }
.ee-color-input { width: 44px; height: 44px; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; padding: 2px; background: #fff; }

.ee-actions { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }

.ee-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; }
.ee-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.ee-table th { text-align: left; padding: 12px 16px; background: #f8fafc; color: #475569; font-weight: 600; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.ee-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
.ee-table tr:last-child td { border-bottom: none; }
.ee-table__actions { display: flex; gap: 8px; white-space: nowrap; }

.ee-empty { padding: 32px 0; text-align: center; color: #94a3b8; font-size: 15px; }

.ee-modal-form { display: flex; flex-direction: column; gap: 16px; }

/* venue layout */
.ee-dropzone { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.2s ease; background: #f8fafc; }
.ee-dropzone:hover { border-color: #0f766e; background: #f0fdf4; }
.ee-dropzone--over { border-color: #0f766e; background: #ecfdf5; transform: scale(1.01); }
.ee-dropzone__icon { font-size: 48px; margin-bottom: 12px; }
.ee-dropzone__text { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px; }
.ee-dropzone__subtext { font-size: 14px; color: #94a3b8; margin: 0 0 16px; }
.ee-dropzone__formats { font-size: 12px; color: #94a3b8; margin: 16px 0 0; }

.ee-venue-preview { text-align: center; }
.ee-venue-preview__image-wrap { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; max-width: 600px; margin: 0 auto 20px; background: #f8fafc; }
.ee-venue-preview__img { width: 100%; height: auto; display: block; }
.ee-venue-preview__actions { display: flex; gap: 12px; justify-content: center; }

/* invitation */
.ee-invite-toggle { margin-bottom: 20px; }
.ee-invite-status { display: inline-block; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
.ee-invite-status--on { background: #dcfce7; color: #166534; }
.ee-invite-status--off { background: #fee2e2; color: #991b1b; }
.ee-invite-links { display: flex; flex-direction: column; gap: 12px; }
.ee-invite-link-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8fafc; border-radius: 10px; }
.ee-invite-link-row__label { font-weight: 600; color: #334155; min-width: 140px; font-size: 14px; }
.ee-invite-link { color: #0f766e; text-decoration: none; font-family: monospace; font-size: 14px; }
.ee-invite-link:hover { text-decoration: underline; }

/* settings */
.ee-settings-grid { display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: start; }
.ee-settings-editor { min-width: 0; }

.ee-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ee-preset { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 10px; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer; transition: all 0.15s ease; }
.ee-preset:hover { border-color: #94a3b8; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.ee-preset--active { border-color: #0f766e; background: #f0fdf4; }
.ee-preset__swatches { display: flex; gap: 4px; }
.ee-preset__swatch { width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.08); }
.ee-preset__name { font-size: 13px; font-weight: 500; color: #334155; }

.ee-danger-text { font-size: 14px; color: #64748b; margin: 0 0 16px; line-height: 1.5; }

/* live preview */
.ee-preview-wrap { position: sticky; top: 140px; }
.ee-preview-toolbar { display: flex; gap: 4px; padding: 4px; background: #f1f5f9; border-radius: 10px; margin-bottom: 16px; width: fit-content; }
.ee-preview-toggle { padding: 6px 16px; border: none; background: transparent; border-radius: 8px; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.15s; }
.ee-preview-toggle--active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.ee-preview-scroll { max-height: calc(100vh - 220px); overflow-y: auto; }
.ee-preview { transition: width 0.25s ease; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.ee-preview__banner { position: relative; display: flex; align-items: flex-end; justify-content: center; padding-bottom: -32px; }
.ee-preview__logo { margin-bottom: -32px; position: relative; z-index: 1; }

@media (max-width: 900px) {
  .ee-settings-grid { grid-template-columns: 1fr; }
  .ee-preview-wrap { position: static; }
  .ee-form-grid { grid-template-columns: 1fr; }
  .ee-presets { grid-template-columns: repeat(2, 1fr); }
}
`;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}

// Inject on module load (guarded for SSR)
if (typeof window !== 'undefined') {
  // run after DOM ready if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
}
