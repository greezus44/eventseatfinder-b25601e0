import { useState, useRef, useCallback, useMemo, useEffect, type DragEvent, type ChangeEvent } from 'react';
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

/* ------------------------------------------------------------------ *
 * Design tokens — modern monochrome (Linear / Notion / Stripe vibe)
 * ------------------------------------------------------------------ */
const C = {
  white: '#FFFFFF',
  offWhite: '#F8F8F8',
  lightGrey: '#EFEFEF',
  midGrey: '#DADADA',
  darkGrey: '#4A4A4A',
  nearBlack: '#1A1A1A',
  danger: '#D64545',
  dangerBg: '#FBECEC',
  border: '#EFEFEF',
  borderStrong: '#E5E5E5',
  textMuted: '#8A8A8A',
};

const TABS = [
  'Event Details',
  'Guests',
  'Tables',
  'Venue Layout',
  'Invitation',
  'Schedule',
  'Settings',
] as const;
type TabName = (typeof TABS)[number];

const MAX_VENUE_BYTES = 5 * 1024 * 1024; // 5MB
const VENUE_ACCEPT = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function formatDateForInput(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeForInput(t: string): string {
  if (!t) return '';
  // Accept "HH:MM" or ISO; normalise to HH:MM
  const m = t.match(/^(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  const date = new Date(t);
  if (!Number.isNaN(date.getTime())) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return t;
}

function prettyDate(d: string, t: string): string {
  if (!d) return 'No date set';
  try {
    const date = new Date(`${d}T${t || '00:00'}`);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + (t ? ` · ${formatTimeForInput(t)}` : '');
  } catch {
    return d;
  }
}

/** Darken a hex colour by a percentage (0..1) — used to derive color_secondary. */
function darken(hex: string, amount = 0.18): string {
  if (!hex || !hex.startsWith('#')) return hex;
  const full = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = parseInt(full.slice(1, 3), 16);
  const g = parseInt(full.slice(3, 5), 16);
  const b = parseInt(full.slice(5, 7), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  const toHex = (v: number) => f(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */
export function EventEditorPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const deleteEvent = useDeleteEvent();

  const [activeTab, setActiveTab] = useState<TabName>('Event Details');

  /* ---------- Loading state ---------- */
  if (eventLoading) {
    return (
      <div className="ee-page">
        <div className="ee-loading">
          <div className="ee-spinner" />
          <p>Loading event…</p>
        </div>
        <EventEditorStyles />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="ee-page">
        <div className="ee-loading">
          <p>Event not found.</p>
          <Link to="/" className="ee-btn ee-btn--primary">Back to dashboard</Link>
        </div>
        <EventEditorStyles />
      </div>
    );
  }

  const accent = event.accent_color || C.nearBlack;

  return (
    <div className="ee-page" style={{ ['--ee-accent' as string]: accent }}>
      {/* ---------- Header ---------- */}
      <header className="ee-header">
        <div className="ee-header__top">
          <Link to="/" className="ee-back">← Dashboard</Link>
        </div>
        <div className="ee-header__main">
          <h1 className="ee-header__title">{event.name || 'Untitled event'}</h1>
          <p className="ee-header__subtitle">
            {prettyDate(event.date, event.time)}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
        </div>
      </header>

      {/* ---------- Sticky tab bar ---------- */}
      <nav className="ee-tabs" role="tablist" aria-label="Event editor sections">
        <div className="ee-tabs__inner">
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={active}
                className={`ee-tab ${active ? 'ee-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---------- Tab content (all sections stay mounted) ---------- */}
      <div className="ee-content">
        <section className={`ee-section ${activeTab === 'Event Details' ? '' : 'ee-hidden'}`}>
          <EventDetailsSection eventId={eventId} />
        </section>
        <section className={`ee-section ${activeTab === 'Guests' ? '' : 'ee-hidden'}`}>
          <GuestsSection eventId={eventId} />
        </section>
        <section className={`ee-section ${activeTab === 'Tables' ? '' : 'ee-hidden'}`}>
          <TablesSection eventId={eventId} />
        </section>
        <section className={`ee-section ${activeTab === 'Venue Layout' ? '' : 'ee-hidden'}`}>
          <VenueLayoutSection eventId={eventId} />
        </section>
        <section className={`ee-section ${activeTab === 'Invitation' ? '' : 'ee-hidden'}`}>
          <InvitationSection eventId={eventId} />
        </section>
        <section className={`ee-section ${activeTab === 'Schedule' ? '' : 'ee-hidden'}`}>
          <ScheduleSection eventId={eventId} />
        </section>
        <section className={`ee-section ${activeTab === 'Settings' ? '' : 'ee-hidden'}`}>
          <SettingsSection eventId={eventId} onDeleteEvent={async () => {
            try {
              await deleteEvent.mutateAsync(eventId);
              toast('Event deleted', 'success');
              navigate('/');
            } catch {
              toast('Failed to delete event', 'error');
            }
          }} />
        </section>
      </div>

      <EventEditorStyles />
    </div>
  );
}

/* ================================================================== *
 * Event Details
 * ================================================================== */
function EventDetailsSection({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    date: '',
    time: '',
    venue: '',
    logo_url: '',
    cover_url: '',
    accent_color: C.nearBlack,
    invitation_enabled: false,
  });
  const [saving, setSaving] = useState(false);

  // Sync form when event loads
  useEffect(() => {
    if (!event) return;
    setForm({
      name: event.name || '',
      slug: event.slug || '',
      date: formatDateForInput(event.date),
      time: formatTimeForInput(event.time),
      venue: event.venue || '',
      logo_url: event.logo_url || '',
      cover_url: event.cover_url || '',
      accent_color: event.accent_color || C.nearBlack,
      invitation_enabled: !!event.invitation_enabled,
    });
  }, [event]);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEvent.mutateAsync({
        name: form.name.trim(),
        slug: form.slug.trim(),
        date: form.date,
        time: form.time,
        venue: form.venue.trim(),
        logo_url: form.logo_url.trim() || null,
        cover_url: form.cover_url.trim() || null,
        accent_color: form.accent_color,
        invitation_enabled: form.invitation_enabled,
      });
      toast('Event details saved', 'success');
    } catch {
      toast('Failed to save event details', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ee-card">
      <div className="ee-card__head">
        <h2 className="ee-card__title">Event details</h2>
        <p className="ee-card__hint">Basic information about your event.</p>
      </div>

      <div className="ee-form">
        <div className="ee-form__row ee-form__row--2">
          <Field label="Event name">
            <input className="ee-input" value={form.name}
              onChange={(e) => set('name', e.target.value)} placeholder="Sarah & Tom's Wedding" />
          </Field>
          <Field label="URL slug">
            <input className="ee-input" value={form.slug}
              onChange={(e) => set('slug', e.target.value)} placeholder="sarah-tom-2025" />
          </Field>
        </div>

        <div className="ee-form__row ee-form__row--2">
          <Field label="Date">
            <input type="date" className="ee-input" value={form.date}
              onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Time">
            <input type="time" className="ee-input" value={form.time}
              onChange={(e) => set('time', e.target.value)} />
          </Field>
        </div>

        <Field label="Venue">
          <input className="ee-input" value={form.venue}
            onChange={(e) => set('venue', e.target.value)} placeholder="The Grand Hall, London" />
        </Field>

        <div className="ee-form__row ee-form__row--2">
          <Field label="Logo URL">
            <input className="ee-input" value={form.logo_url}
              onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Cover image URL">
            <input className="ee-input" value={form.cover_url}
              onChange={(e) => set('cover_url', e.target.value)} placeholder="https://…" />
          </Field>
        </div>

        <Field label="Accent colour">
          <div className="ee-color">
            <input type="color" className="ee-color__swatch" value={form.accent_color}
              onChange={(e) => set('accent_color', e.target.value)} />
            <input className="ee-input ee-color__hex" value={form.accent_color}
              onChange={(e) => set('accent_color', e.target.value)} />
          </div>
        </Field>

        <label className="ee-check">
          <input type="checkbox" checked={form.invitation_enabled}
            onChange={(e) => set('invitation_enabled', e.target.checked)} />
          <span>Invitation page enabled</span>
        </label>
      </div>

      <div className="ee-card__foot">
        <button className="ee-btn ee-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Guests
 * ================================================================== */
function GuestsSection({ eventId }: { eventId: string }) {
  const { data: guests = [], isLoading } = useGuests(eventId);
  const { data: tables = [] } = useTables(eventId);
  const createGuest = useCreateGuest(eventId);
  const bulkCreate = useBulkCreateGuests(eventId);
  const updateGuest = useUpdateGuest(eventId);
  const deleteGuest = useDeleteGuest(eventId);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<GuestWithTable | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add modal state
  const [newName, setNewName] = useState('');
  const [newTable, setNewTable] = useState('');

  // Bulk state
  const [bulkText, setBulkText] = useState('');

  // Edit state
  const [editName, setEditName] = useState('');
  const [editTable, setEditTable] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => g.name.toLowerCase().includes(q));
  }, [guests, search]);

  const guestCountByTable = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of guests) {
      if (g.table_id) m.set(g.table_id, (m.get(g.table_id) || 0) + 1);
    }
    return m;
  }, [guests]);

  const openAdd = () => {
    setNewName('');
    setNewTable('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast('Enter a guest name', 'error');
      return;
    }
    try {
      await createGuest.mutateAsync({
        name: newName.trim(),
        table_id: newTable || null,
      });
      toast('Guest added', 'success');
      setAddOpen(false);
    } catch {
      toast('Failed to add guest', 'error');
    }
  };

  const openBulk = () => {
    setBulkText('');
    setBulkOpen(true);
  };

  const handleBulk = async () => {
    const names = bulkText.split('\n').map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) {
      toast('Enter at least one name', 'error');
      return;
    }
    try {
      await bulkCreate.mutateAsync(names.map((name) => ({ name })));
      toast(`${names.length} guest${names.length === 1 ? '' : 's'} added`, 'success');
      setBulkOpen(false);
    } catch {
      toast('Failed to add guests', 'error');
    }
  };

  const openEdit = (g: GuestWithTable) => {
    setEditGuest(g);
    setEditName(g.name);
    setEditTable(g.table_id || '');
  };

  const handleEdit = async () => {
    if (!editGuest) return;
    if (!editName.trim()) {
      toast('Enter a guest name', 'error');
      return;
    }
    try {
      await updateGuest.mutateAsync({
        id: editGuest.id,
        name: editName.trim(),
        table_id: editTable || null,
      });
      toast('Guest updated', 'success');
      setEditGuest(null);
    } catch {
      toast('Failed to update guest', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGuest.mutateAsync(deleteId);
      toast('Guest removed', 'success');
      setDeleteId(null);
    } catch {
      toast('Failed to remove guest', 'error');
    }
  };

  return (
    <div className="ee-card">
      <div className="ee-card__head ee-card__head--row">
        <div>
          <h2 className="ee-card__title">Guests</h2>
          <p className="ee-card__hint">{guests.length} guest{guests.length === 1 ? '' : 's'} total.</p>
        </div>
        <div className="ee-card__actions">
          <button className="ee-btn ee-btn--secondary" onClick={openBulk}>Bulk add</button>
          <button className="ee-btn ee-btn--primary" onClick={openAdd}>Add guest</button>
        </div>
      </div>

      <div className="ee-toolbar">
        <input className="ee-input ee-input--search" placeholder="Search guests…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="ee-muted">Loading guests…</p>
      ) : filtered.length === 0 ? (
        <div className="ee-empty">
          <p>{search ? 'No guests match your search.' : 'No guests yet. Add your first guest.'}</p>
        </div>
      ) : (
        <div className="ee-table-wrap">
          <table className="ee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Table</th>
                <th className="ee-table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id}>
                  <td className="ee-table__name">{g.name}</td>
                  <td className="ee-table__muted">
                    {g.table ? `Table ${g.table.number} · ${g.table.name}` : '—'}
                  </td>
                  <td className="ee-table__actions">
                    <button className="ee-icon-btn" title="Edit" onClick={() => openEdit(g)}>Edit</button>
                    <button className="ee-icon-btn ee-icon-btn--danger" title="Remove"
                      onClick={() => setDeleteId(g.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add guest">
        <div className="ee-modal-form">
          <Field label="Guest name">
            <input className="ee-input" value={newName}
              onChange={(e) => setNewName(e.target.value)} placeholder="Jane Doe"
              autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
          </Field>
          <Field label="Table (optional)">
            <select className="ee-input ee-select" value={newTable}
              onChange={(e) => setNewTable(e.target.value)}>
              <option value="">No table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} · {t.name} ({guestCountByTable.get(t.id) || 0}/{t.capacity})
                </option>
              ))}
            </select>
          </Field>
          <div className="ee-modal-actions">
            <button className="ee-btn ee-btn--secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="ee-btn ee-btn--primary" onClick={handleAdd}
              disabled={createGuest.isPending}>Add guest</button>
          </div>
        </div>
      </Modal>

      {/* Bulk add modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk add guests">
        <div className="ee-modal-form">
          <Field label="Guest names — one per line">
            <textarea className="ee-input ee-textarea" rows={8} value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'Jane Doe\nJohn Smith\nMaria Garcia'} />
          </Field>
          <div className="ee-modal-actions">
            <button className="ee-btn ee-btn--secondary" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button className="ee-btn ee-btn--primary" onClick={handleBulk}
              disabled={bulkCreate.isPending}>Add all</button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editGuest} onClose={() => setEditGuest(null)} title="Edit guest">
        <div className="ee-modal-form">
          <Field label="Guest name">
            <input className="ee-input" value={editName}
              onChange={(e) => setEditName(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); }} />
          </Field>
          <Field label="Table (optional)">
            <select className="ee-input ee-select" value={editTable}
              onChange={(e) => setEditTable(e.target.value)}>
              <option value="">No table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} · {t.name} ({guestCountByTable.get(t.id) || 0}/{t.capacity})
                </option>
              ))}
            </select>
          </Field>
          <div className="ee-modal-actions">
            <button className="ee-btn ee-btn--secondary" onClick={() => setEditGuest(null)}>Cancel</button>
            <button className="ee-btn ee-btn--primary" onClick={handleEdit}
              disabled={updateGuest.isPending}>Save</button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        title="Remove guest?"
        message="This guest will be permanently removed from the event."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

/* ================================================================== *
 * Tables
 * ================================================================== */
function TablesSection({ eventId }: { eventId: string }) {
  const { data: tables = [], isLoading } = useTables(eventId);
  const { data: guests = [] } = useGuests(eventId);
  const createTable = useCreateTable(eventId);
  const deleteTable = useDeleteTable(eventId);
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [number, setNumber] = useState('1');
  const [capacity, setCapacity] = useState('8');

  const guestCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of guests) {
      if (g.table_id) m.set(g.table_id, (m.get(g.table_id) || 0) + 1);
    }
    return m;
  }, [guests]);

  const nextNumber = useMemo(() => {
    if (tables.length === 0) return 1;
    return Math.max(...tables.map((t) => t.number)) + 1;
  }, [tables]);

  const openAdd = () => {
    setName('');
    setNumber(String(nextNumber));
    setCapacity('8');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      toast('Enter a table name', 'error');
      return;
    }
    const n = parseInt(number, 10);
    const cap = parseInt(capacity, 10);
    if (Number.isNaN(n) || n < 1) {
      toast('Enter a valid table number', 'error');
      return;
    }
    try {
      await createTable.mutateAsync({
        name: name.trim(),
        number: n,
        capacity: Number.isNaN(cap) || cap < 1 ? 8 : cap,
      });
      toast('Table added', 'success');
      setAddOpen(false);
    } catch {
      toast('Failed to add table', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTable.mutateAsync(deleteId);
      toast('Table removed', 'success');
      setDeleteId(null);
    } catch {
      toast('Failed to remove table', 'error');
    }
  };

  return (
    <div className="ee-card">
      <div className="ee-card__head ee-card__head--row">
        <div>
          <h2 className="ee-card__title">Tables</h2>
          <p className="ee-card__hint">{tables.length} table{tables.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="ee-card__actions">
          <button className="ee-btn ee-btn--primary" onClick={openAdd}>Add table</button>
        </div>
      </div>

      {isLoading ? (
        <p className="ee-muted">Loading tables…</p>
      ) : tables.length === 0 ? (
        <div className="ee-empty">
          <p>No tables yet. Add your first table.</p>
        </div>
      ) : (
        <div className="ee-table-list">
          {tables.map((t) => {
            const count = guestCount.get(t.id) || 0;
            const full = count >= t.capacity;
            return (
              <div key={t.id} className="ee-table-row">
                <div className="ee-table-row__num">{t.number}</div>
                <div className="ee-table-row__name">{t.name}</div>
                <div className={`ee-table-row__count ${full ? 'ee-table-row__count--full' : ''}`}>
                  {count}/{t.capacity} guests
                </div>
                <button className="ee-icon-btn ee-icon-btn--danger"
                  onClick={() => setDeleteId(t.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add table">
        <div className="ee-modal-form">
          <Field label="Table name">
            <input className="ee-input" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Head table"
              autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
          </Field>
          <div className="ee-form__row ee-form__row--2">
            <Field label="Table number">
              <input type="number" min={1} className="ee-input" value={number}
                onChange={(e) => setNumber(e.target.value)} />
            </Field>
            <Field label="Capacity">
              <input type="number" min={1} className="ee-input" value={capacity}
                onChange={(e) => setCapacity(e.target.value)} />
            </Field>
          </div>
          <div className="ee-modal-actions">
            <button className="ee-btn ee-btn--secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="ee-btn ee-btn--primary" onClick={handleAdd}
              disabled={createTable.isPending}>Add table</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Remove table?"
        message="Guests assigned to this table will become unassigned. The table itself will be removed."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

/* ================================================================== *
 * Venue Layout — simplified image upload
 * ================================================================== */
function VenueLayoutSection({ eventId }: { eventId: string }) {
  const { data: settings } = useGuestPageSettings(eventId);
  const upsert = useUpsertGuestPageSettings(eventId);
  const { toast } = useToast();

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const venueImage = settings?.venue_image_url ?? null;

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!VENUE_ACCEPT.includes(file.type)) {
      setError('Unsupported format. Use PNG, JPG, or WebP.');
      return;
    }
    if (file.size > MAX_VENUE_BYTES) {
      setError(`File too large (${formatBytes(file.size)}). Max 5MB.`);
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      await upsert.mutateAsync({ venue_image_url: dataUrl });
      toast('Venue layout uploaded', 'success');
    } catch {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [upsert, toast]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so selecting the same file again still fires change
    e.target.value = '';
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await upsert.mutateAsync({ venue_image_url: null });
      toast('Venue layout removed', 'success');
    } catch {
      toast('Failed to remove image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = () => fileInputRef.current?.click();

  return (
    <div className="ee-card">
      <div className="ee-card__head">
        <h2 className="ee-card__title">Venue layout</h2>
        <p className="ee-card__hint">
          Upload a floor plan or venue diagram so guests can find their seats.
          PNG, JPG, or WebP up to 5MB.
        </p>
      </div>

      <input ref={fileInputRef} type="file" accept={VENUE_ACCEPT.join(',')}
        onChange={onFileChange} style={{ display: 'none' }} />

      {error && <div className="ee-alert ee-alert--error">{error}</div>}

      {venueImage ? (
        <div className="ee-venue-preview">
          <div className="ee-venue-preview__img-wrap">
            <img src={venueImage} alt="Venue layout" className="ee-venue-preview__img" />
          </div>
          <div className="ee-venue-preview__actions">
            <button className="ee-btn ee-btn--secondary" onClick={handleReplace}
              disabled={uploading}>Replace image</button>
            <button className="ee-btn ee-btn--danger" onClick={handleRemove}
              disabled={uploading}>Remove image</button>
          </div>
        </div>
      ) : (
        <div
          className={`ee-dropzone ${dragOver ? 'ee-dropzone--over' : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={handleReplace}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleReplace(); }}
        >
          <div className="ee-dropzone__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="ee-dropzone__title">
            {uploading ? 'Uploading…' : 'Drag & drop your venue layout here'}
          </p>
          <p className="ee-dropzone__hint">or click to browse files</p>
          <p className="ee-dropzone__formats">PNG, JPG, WebP · max 5MB</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== *
 * Invitation
 * ================================================================== */
function InvitationSection({ eventId }: { eventId: string }) {
  const { data: event } = useEvent(eventId);
  const updateEvent = useUpdateEvent(eventId);
  const { toast } = useToast();

  const [toggling, setToggling] = useState(false);
  const enabled = !!event?.invitation_enabled;
  const slug = event?.slug || '';

  const toggle = async () => {
    setToggling(true);
    try {
      await updateEvent.mutateAsync({ invitation_enabled: !enabled });
      toast(enabled ? 'Invitation disabled' : 'Invitation enabled', 'success');
    } catch {
      toast('Failed to update invitation setting', 'error');
    } finally {
      setToggling(false);
    }
  };

  const copyLink = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard?.writeText(url).then(
      () => toast('Link copied', 'success'),
      () => toast('Could not copy link', 'error'),
    );
  };

  return (
    <div className="ee-card">
      <div className="ee-card__head">
        <h2 className="ee-card__title">Invitation</h2>
        <p className="ee-card__hint">Control your public guest pages.</p>
      </div>

      <div className="ee-status-row">
        <div className="ee-status-row__text">
          <p className="ee-status-row__label">Invitation page</p>
          <p className="ee-status-row__value">
            <span className={`ee-badge ${enabled ? 'ee-badge--on' : 'ee-badge--off'}`}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
        </div>
        <button className="ee-btn ee-btn--secondary" onClick={toggle} disabled={toggling}>
          {enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div className="ee-link-list">
        <div className="ee-link-row">
          <div className="ee-link-row__info">
            <p className="ee-link-row__title">Invitation page</p>
            <p className="ee-link-row__url">/invite/{slug}</p>
          </div>
          <div className="ee-link-row__actions">
            <button className="ee-icon-btn" onClick={() => copyLink(`/invite/${slug}`)}>Copy</button>
            <Link className="ee-icon-btn ee-icon-btn--link" to={`/invite/${slug}`} target="_blank">Open</Link>
          </div>
        </div>
        <div className="ee-link-row">
          <div className="ee-link-row__info">
            <p className="ee-link-row__title">Find your seat</p>
            <p className="ee-link-row__url">/e/{slug}</p>
          </div>
          <div className="ee-link-row__actions">
            <button className="ee-icon-btn" onClick={() => copyLink(`/e/${slug}`)}>Copy</button>
            <Link className="ee-icon-btn ee-icon-btn--link" to={`/e/${slug}`} target="_blank">Open</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Schedule
 * ================================================================== */
function ScheduleSection({ eventId }: { eventId: string }) {
  const { data: settings } = useGuestPageSettings(eventId);
  const upsert = useUpsertGuestPageSettings(eventId);
  const { toast } = useToast();

  const [enableSchedule, setEnableSchedule] = useState(false);
  const [scheduleText, setScheduleText] = useState('[]');
  const [enableGallery, setEnableGallery] = useState(false);
  const [galleryText, setGalleryText] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [eventSubtitle, setEventSubtitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync from server settings once available
  useEffect(() => {
    if (!settings) return;
    setEnableSchedule(!!settings.enable_schedule);
    setScheduleText(() => {
      try { return JSON.stringify(settings.schedule_items ?? [], null, 2); }
      catch { return '[]'; }
    });
    setEnableGallery(!!settings.enable_gallery);
    setGalleryText((settings.gallery_images ?? []).join('\n'));
    setWelcomeMessage(settings.welcome_message ?? '');
    setEventSubtitle(settings.event_subtitle ?? '');
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedSchedule: unknown[] = [];
      try {
        parsedSchedule = JSON.parse(scheduleText);
        if (!Array.isArray(parsedSchedule)) {
          throw new Error('not an array');
        }
      } catch {
        toast('Schedule items must be valid JSON array', 'error');
        setSaving(false);
        return;
      }
      const galleryImages = galleryText.split('\n').map((u) => u.trim()).filter(Boolean);

      await upsert.mutateAsync({
        enable_schedule: enableSchedule,
        schedule_items: parsedSchedule,
        enable_gallery: enableGallery,
        gallery_images: galleryImages,
        welcome_message: welcomeMessage.trim() || null,
        event_subtitle: eventSubtitle.trim() || null,
      });
      toast('Schedule saved', 'success');
    } catch {
      toast('Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ee-card">
      <div className="ee-card__head">
        <h2 className="ee-card__title">Schedule & gallery</h2>
        <p className="ee-card__hint">Optional content sections for your guest page.</p>
      </div>

      <div className="ee-form">
        <label className="ee-check">
          <input type="checkbox" checked={enableSchedule}
            onChange={(e) => setEnableSchedule(e.target.checked)} />
          <span>Enable schedule</span>
        </label>
        <Field label="Schedule items (JSON array)">
          <textarea className="ee-input ee-textarea ee-textarea--mono" rows={10} value={scheduleText}
            onChange={(e) => setScheduleText(e.target.value)}
            placeholder={'[\n  { "time": "14:00", "title": "Ceremony" },\n  { "time": "17:00", "title": "Reception" }\n]'} />
        </Field>

        <label className="ee-check">
          <input type="checkbox" checked={enableGallery}
            onChange={(e) => setEnableGallery(e.target.checked)} />
          <span>Enable gallery</span>
        </label>
        <Field label="Gallery image URLs — one per line">
          <textarea className="ee-input ee-textarea" rows={5} value={galleryText}
            onChange={(e) => setGalleryText(e.target.value)}
            placeholder={'https://…/photo1.jpg\nhttps://…/photo2.jpg'} />
        </Field>

        <Field label="Welcome message">
          <textarea className="ee-input ee-textarea" rows={3} value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Welcome to our special day…" />
        </Field>

        <Field label="Event subtitle">
          <input className="ee-input" value={eventSubtitle}
            onChange={(e) => setEventSubtitle(e.target.value)}
            placeholder="A celebration of love" />
        </Field>
      </div>

      <div className="ee-card__foot">
        <button className="ee-btn ee-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Settings — simplified theme editor
 * ================================================================== */
function SettingsSection({ eventId, onDeleteEvent }: { eventId: string; onDeleteEvent: () => void }) {
  const { data: event } = useEvent(eventId);
  const { data: settings } = useGuestPageSettings(eventId);
  const upsert = useUpsertGuestPageSettings(eventId);
  const { toast } = useToast();

  const [form, setForm] = useState<GuestPageSettingsInput>(() => ({ ...DEFAULT_SETTINGS }));
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync from server settings once available
  useEffect(() => {
    if (!settings) return;
    setForm({
      ...DEFAULT_SETTINGS,
      ...settings,
      // ensure array-ish fields are plain values (not null)
      schedule_items: settings.schedule_items ?? [],
      gallery_images: settings.gallery_images ?? [],
    });
  }, [settings]);

  const set = <K extends keyof GuestPageSettingsInput>(k: K, v: GuestPageSettingsInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const applyPreset = (preset: typeof THEME_PRESETS[number]) => {
    setForm((f) => ({
      ...f,
      color_primary: preset.color_primary,
      color_secondary: darken(preset.color_primary, 0.2),
      color_background: preset.color_background,
      color_card: preset.color_card,
      color_text: preset.color_text,
      color_header: preset.color_background,
      color_button: preset.color_button,
      color_button_text: preset.color_button_text,
      color_link: preset.color_link,
      color_footer: preset.color_footer,
      font_heading: preset.font_heading,
      font_body: preset.font_body,
    }));
  };

  // When primary changes, auto-derive the dependent colours
  const setPrimary = (hex: string) => {
    setForm((f) => ({
      ...f,
      color_primary: hex,
      color_link: hex,
      color_secondary: darken(hex, 0.2),
    }));
  };

  // When background changes, derive header = background
  const setBackground = (hex: string) => {
    setForm((f) => ({
      ...f,
      color_background: hex,
      color_header: hex,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert.mutateAsync(form);
      toast('Theme saved', 'success');
    } catch {
      toast('Failed to save theme', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    onDeleteEvent();
  };

  const accent = event?.accent_color || C.nearBlack;

  return (
    <div className="ee-settings-grid">
      {/* ---------- Left: editor ---------- */}
      <div className="ee-settings-editor">
        {/* Theme presets */}
        <div className="ee-card">
          <div className="ee-card__head">
            <h2 className="ee-card__title">Theme presets</h2>
            <p className="ee-card__hint">Click a preset to apply it instantly.</p>
          </div>
          <div className="ee-presets">
            {THEME_PRESETS.map((p) => (
              <button key={p.name} className="ee-preset" onClick={() => applyPreset(p)}
                title={p.name}>
                <div className="ee-preset__swatches">
                  <span className="ee-preset__swatch" style={{ background: p.color_background }} />
                  <span className="ee-preset__swatch" style={{ background: p.color_primary }} />
                  <span className="ee-preset__swatch" style={{ background: p.color_button }} />
                </div>
                <span className="ee-preset__name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div className="ee-card">
          <div className="ee-card__head">
            <h2 className="ee-card__title">Branding</h2>
          </div>
          <div className="ee-form">
            <Field label="Event logo URL">
              <input className="ee-input" value={form.logo_url ?? ''}
                onChange={(e) => set('logo_url', e.target.value || null)} placeholder="https://…" />
            </Field>
            <Field label="Cover image URL">
              <input className="ee-input" value={form.cover_image ?? ''}
                onChange={(e) => set('cover_image', e.target.value || null)} placeholder="https://…" />
            </Field>
          </div>
        </div>

        {/* Colours */}
        <div className="ee-card">
          <div className="ee-card__head">
            <h2 className="ee-card__title">Colours</h2>
            <p className="ee-card__hint">Three core colours — the rest are derived automatically.</p>
          </div>
          <div className="ee-form">
            <ColorField label="Primary / accent" value={form.color_primary ?? '#1A1A1A'}
              onChange={setPrimary} />
            <ColorField label="Background" value={form.color_background ?? '#F8F8F8'}
              onChange={setBackground} />
            <ColorField label="Button" value={form.color_button ?? '#1A1A1A'}
              onChange={(hex) => set('color_button', hex)} />
          </div>
        </div>

        {/* Fonts */}
        <div className="ee-card">
          <div className="ee-card__head">
            <h2 className="ee-card__title">Fonts</h2>
          </div>
          <div className="ee-form">
            <Field label="Heading font">
              <FontSelect value={form.font_heading ?? 'Inter'}
                onChange={(v) => set('font_heading', v)} />
            </Field>
            <Field label="Body font">
              <FontSelect value={form.font_body ?? 'Inter'}
                onChange={(v) => set('font_body', v)} />
            </Field>
          </div>
        </div>

        {/* Danger zone */}
        <div className="ee-card ee-card--danger">
          <div className="ee-card__head ee-card__head--row">
            <div>
              <h2 className="ee-card__title">Danger zone</h2>
              <p className="ee-card__hint">Permanently delete this event and all its data.</p>
            </div>
            <button className="ee-btn ee-btn--danger" onClick={() => setDeleteOpen(true)}>
              Delete event
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Right: sticky live preview ---------- */}
      <div className="ee-settings-preview">
        <div className="ee-preview-sticky">
          <div className="ee-preview-toolbar">
            <span className="ee-preview-toolbar__label">Live preview</span>
            <div className="ee-preview-toggle">
              <button className={`ee-preview-toggle__btn ${previewMode === 'desktop' ? 'ee-preview-toggle__btn--active' : ''}`}
                onClick={() => setPreviewMode('desktop')}>Desktop</button>
              <button className={`ee-preview-toggle__btn ${previewMode === 'mobile' ? 'ee-preview-toggle__btn--active' : ''}`}
                onClick={() => setPreviewMode('mobile')}>Mobile</button>
            </div>
          </div>

          <div className={`ee-preview-frame ${previewMode === 'mobile' ? 'ee-preview-frame--mobile' : ''}`}>
            <ThemePreview settings={form} eventName={event?.name || 'Your event'}
              eventVenue={event?.venue || 'Your venue'} accent={accent} />
          </div>

          <button className="ee-btn ee-btn--primary ee-btn--block" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save theme'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this event?"
        message="This will permanently delete the event along with all guests, tables, and settings. This cannot be undone."
        confirmLabel="Delete event"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

/* ---------- Theme preview card ---------- */
function ThemePreview({ settings, eventName, eventVenue, accent }: {
  settings: GuestPageSettingsInput;
  eventName: string;
  eventVenue: string;
  accent: string;
}) {
  const bg = settings.color_background || '#F8F8F8';
  const card = settings.color_card || '#FFFFFF';
  const text = settings.color_text || '#1A1A1A';
  const primary = settings.color_primary || accent;
  const button = settings.color_button || '#1A1A1A';
  const buttonText = settings.color_button_text || '#FFFFFF';
  const link = settings.color_link || primary;
  const footer = settings.color_footer || '#1A1A1A';
  const fontHeading = settings.font_heading || 'Inter';
  const fontBody = settings.font_body || 'Inter';
  const radius = settings.border_radius ?? 16;
  const cover = settings.cover_image || null;
  const logo = settings.logo_url || null;

  return (
    <div className="ee-theme-preview" style={{
      background: bg, color: text, fontFamily: `'${fontBody}', sans-serif`,
      borderRadius: 8, overflow: 'hidden',
    }}>
      {/* Cover */}
      <div className="ee-theme-preview__cover" style={{
        height: 120,
        backgroundImage: cover ? `url(${cover})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        background: cover ? undefined : `linear-gradient(135deg, ${primary}, ${darken(primary, 0.25)})`,
      }} />

      {/* Logo */}
      {logo && (
        <div className="ee-theme-preview__logo" style={{ marginTop: -28 }}>
          <img src={logo} alt="logo" style={{
            width: 56, height: 56, objectFit: 'cover',
            borderRadius: settings.logo_rounded ? '50%' : 8,
            border: `2px solid ${card}`,
          }} />
        </div>
      )}

      {/* Body */}
      <div className="ee-theme-preview__body" style={{ padding: '16px 20px' }}>
        <h3 style={{
          fontFamily: `'${fontHeading}', serif`,
          color: text, margin: '8px 0 4px', fontSize: 22, fontWeight: 700,
          letterSpacing: 0,
        }}>{eventName}</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.7 }}>{eventVenue}</p>

        {/* Card */}
        <div style={{
          background: card, borderRadius: Math.min(radius, 16), padding: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5 }}>
            Welcome! Please find your seat and join us for the celebration.
          </p>
          <button style={{
            background: button, color: buttonText, border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Find your seat</button>
          <span style={{ marginLeft: 12, fontSize: 13, color: link, textDecoration: 'underline' }}>
            View schedule
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: footer, color: '#F8F8F8', padding: '12px 20px',
        fontSize: 12, textAlign: 'center',
      }}>
        Made with care · {new Date().getFullYear()}
      </div>
    </div>
  );
}

/* ---------- Font dropdown (renders each option in its font) ---------- */
function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="ee-input ee-select ee-select--font" value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontFamily: `'${value}', sans-serif` }}>
      {FONT_OPTIONS.map((f) => (
        <option key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>
          {f}
        </option>
      ))}
    </select>
  );
}

/* ---------- Small reusable field ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ee-field">
      <label className="ee-field__label">{label}</label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (hex: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="ee-color">
        <input type="color" className="ee-color__swatch" value={value}
          onChange={(e) => onChange(e.target.value)} />
        <input className="ee-input ee-color__hex" value={value}
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

/* ================================================================== *
 * Styles — scoped, modern monochrome
 * ================================================================== */
function EventEditorStyles() {
  return (
    <style>{`
/* ---------- Page shell ---------- */
.ee-page {
  --ee-accent: #1A1A1A;
  --ee-radius: 12px;
  --ee-radius-sm: 8px;
  --ee-border: #EFEFEF;
  --ee-border-strong: #E5E5E5;
  --ee-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
  --ee-shadow-lg: 0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  min-height: 100vh;
  background: ${C.offWhite};
  color: ${C.nearBlack};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.ee-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; gap: 16px; color: ${C.darkGrey};
}
.ee-spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid ${C.lightGrey}; border-top-color: var(--ee-accent);
  animation: ee-spin 0.7s linear infinite;
}
@keyframes ee-spin { to { transform: rotate(360deg); } }

/* ---------- Header ---------- */
.ee-header {
  max-width: 960px; margin: 0 auto; padding: 32px 24px 8px;
}
.ee-header__top { margin-bottom: 16px; }
.ee-back {
  font-size: 13px; color: ${C.darkGrey}; text-decoration: none;
  transition: color 200ms ease;
}
.ee-back:hover { color: var(--ee-accent); }
.ee-header__main { }
.ee-header__title {
  font-size: 28px; font-weight: 700; letter-spacing: -0.02em;
  margin: 0 0 4px; color: ${C.nearBlack};
}
.ee-header__subtitle {
  font-size: 14px; color: ${C.darkGrey}; margin: 0;
}

/* ---------- Sticky tab bar ---------- */
.ee-tabs {
  position: sticky; top: 0; z-index: 20;
  background: rgba(248,248,248,0.85);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--ee-border);
}
.ee-tabs__inner {
  max-width: 960px; margin: 0 auto; padding: 12px 24px;
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
}
.ee-tabs__inner::-webkit-scrollbar { display: none; }
.ee-tab {
  appearance: none; border: none; background: transparent;
  padding: 8px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 500; color: ${C.darkGrey};
  cursor: pointer; white-space: nowrap;
  transition: background 200ms ease, color 200ms ease, transform 200ms ease;
}
.ee-tab:hover { background: ${C.lightGrey}; color: ${C.nearBlack}; }
.ee-tab:active { transform: scale(0.97); }
.ee-tab--active {
  background: var(--ee-accent); color: #FFFFFF;
}
.ee-tab--active:hover { background: var(--ee-accent); color: #FFFFFF; }

/* ---------- Content ---------- */
.ee-content {
  max-width: 960px; margin: 0 auto; padding: 24px;
}
.ee-section { animation: ee-fade 200ms ease; }
@keyframes ee-fade { from { opacity: 0; } to { opacity: 1; } }
.ee-hidden { display: none !important; }

/* ---------- Card ---------- */
.ee-card {
  background: ${C.white}; border: 1px solid var(--ee-border);
  border-radius: var(--ee-radius); box-shadow: var(--ee-shadow);
  padding: 24px; margin-bottom: 16px;
}
.ee-card--danger { border-color: #F0D5D5; }
.ee-card__head { margin-bottom: 20px; }
.ee-card__head--row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  margin-bottom: 20px;
}
.ee-card__title {
  font-size: 17px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em;
}
.ee-card__hint { font-size: 13px; color: ${C.textMuted}; margin: 0; }
.ee-card__foot {
  margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--ee-border);
  display: flex; gap: 8px;
}
.ee-card__actions { display: flex; gap: 8px; flex-shrink: 0; }

/* ---------- Buttons ---------- */
.ee-btn {
  appearance: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; font-family: inherit;
  padding: 9px 16px; border-radius: var(--ee-radius-sm);
  transition: background 200ms ease, color 200ms ease, opacity 200ms ease, transform 200ms ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.ee-btn:active { transform: scale(0.98); }
.ee-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ee-btn--primary { background: var(--ee-accent); color: #FFFFFF; }
.ee-btn--primary:hover:not(:disabled) { opacity: 0.9; }
.ee-btn--secondary { background: ${C.lightGrey}; color: ${C.nearBlack}; }
.ee-btn--secondary:hover:not(:disabled) { background: ${C.midGrey}; }
.ee-btn--danger { background: ${C.dangerBg}; color: ${C.danger}; }
.ee-btn--danger:hover:not(:disabled) { background: #F5D8D8; }
.ee-btn--block { width: 100%; margin-top: 12px; }

/* ---------- Forms ---------- */
.ee-form { display: flex; flex-direction: column; gap: 16px; }
.ee-form__row { display: flex; gap: 16px; }
.ee-form__row--2 { flex-direction: row; }
.ee-form__row--2 > .ee-field { flex: 1; }
@media (max-width: 600px) {
  .ee-form__row--2 { flex-direction: column; }
}
.ee-field { display: flex; flex-direction: column; gap: 6px; }
.ee-field__label {
  font-size: 12px; font-weight: 500; color: ${C.darkGrey};
  letter-spacing: 0.01em;
}
.ee-input {
  appearance: none; width: 100%; box-sizing: border-box;
  font-size: 14px; font-family: inherit; color: ${C.nearBlack};
  background: ${C.white}; border: 1px solid var(--ee-border-strong);
  border-radius: var(--ee-radius-sm); padding: 10px 12px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.ee-input::placeholder { color: ${C.textMuted}; }
.ee-input:hover { border-color: ${C.midGrey}; }
.ee-input:focus {
  outline: none; border-color: var(--ee-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ee-accent) 15%, transparent);
}
.ee-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
.ee-textarea--mono { font-family: 'SF Mono', 'Menlo', 'Consolas', monospace; font-size: 13px; }
.ee-select { cursor: pointer; }
.ee-input--search { max-width: 320px; }

/* ---------- Checkbox ---------- */
.ee-check {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  font-size: 14px; color: ${C.nearBlack};
}
.ee-check input { width: 16px; height: 16px; accent-color: var(--ee-accent); cursor: pointer; }

/* ---------- Color picker ---------- */
.ee-color { display: flex; gap: 8px; align-items: stretch; }
.ee-color__swatch {
  appearance: none; width: 44px; height: auto; min-height: 40px;
  border: 1px solid var(--ee-border-strong); border-radius: var(--ee-radius-sm);
  cursor: pointer; padding: 2px; background: ${C.white};
  transition: border-color 200ms ease;
}
.ee-color__swatch:hover { border-color: ${C.midGrey}; }
.ee-color__hex { flex: 1; }

/* ---------- Toolbar / search ---------- */
.ee-toolbar { margin-bottom: 16px; }

/* ---------- Table ---------- */
.ee-table-wrap { overflow-x: auto; border: 1px solid var(--ee-border); border-radius: var(--ee-radius-sm); }
.ee-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.ee-table thead th {
  text-align: left; font-size: 12px; font-weight: 500; color: ${C.darkGrey};
  padding: 10px 14px; border-bottom: 1px solid var(--ee-border);
  background: ${C.offWhite}; text-transform: uppercase; letter-spacing: 0.04em;
}
.ee-table tbody td { padding: 12px 14px; border-bottom: 1px solid var(--ee-border); }
.ee-table tbody tr:last-child td { border-bottom: none; }
.ee-table tbody tr { transition: background 200ms ease; }
.ee-table tbody tr:hover { background: ${C.offWhite}; }
.ee-table__name { font-weight: 500; }
.ee-table__muted { color: ${C.darkGrey}; }
.ee-table__actions-col { width: 1%; text-align: right; }
.ee-table__actions { display: flex; gap: 6px; justify-content: flex-end; }

/* ---------- Icon / text buttons ---------- */
.ee-icon-btn {
  appearance: none; border: 1px solid transparent; background: transparent;
  color: ${C.darkGrey}; font-size: 13px; font-weight: 500; font-family: inherit;
  padding: 6px 10px; border-radius: 6px; cursor: pointer;
  transition: background 200ms ease, color 200ms ease;
}
.ee-icon-btn:hover { background: ${C.lightGrey}; color: ${C.nearBlack}; }
.ee-icon-btn--danger:hover { background: ${C.dangerBg}; color: ${C.danger}; }
.ee-icon-btn--link { text-decoration: none; display: inline-flex; align-items: center; }

/* ---------- Empty state ---------- */
.ee-empty {
  text-align: center; padding: 40px 20px; color: ${C.textMuted};
  border: 1px dashed var(--ee-border-strong); border-radius: var(--ee-radius-sm);
  font-size: 14px;
}

/* ---------- Muted text ---------- */
.ee-muted { color: ${C.textMuted}; font-size: 14px; }

/* ---------- Modal ---------- */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(26,26,26,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 100;
  padding: 20px; animation: ee-fade 150ms ease;
}
.modal {
  background: ${C.white}; border-radius: var(--ee-radius);
  box-shadow: var(--ee-shadow-lg); padding: 24px;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  animation: ee-pop 200ms ease;
}
@keyframes ee-pop { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.modal__title { font-size: 17px; font-weight: 600; margin: 0 0 12px; }
.modal__message { font-size: 14px; color: ${C.darkGrey}; margin: 0 0 20px; line-height: 1.5; }
.modal__actions { display: flex; gap: 8px; justify-content: flex-end; }
.ee-modal-form { display: flex; flex-direction: column; gap: 16px; }
.ee-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

/* ---------- Alert ---------- */
.ee-alert {
  padding: 10px 14px; border-radius: var(--ee-radius-sm); font-size: 13px;
  margin-bottom: 16px;
}
.ee-alert--error { background: ${C.dangerBg}; color: ${C.danger}; border: 1px solid #F0D5D5; }

/* ---------- Tables list ---------- */
.ee-table-list { display: flex; flex-direction: column; gap: 8px; }
.ee-table-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 16px; border: 1px solid var(--ee-border);
  border-radius: var(--ee-radius-sm); background: ${C.white};
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.ee-table-row:hover { border-color: var(--ee-border-strong); box-shadow: var(--ee-shadow); }
.ee-table-row__num {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: ${C.offWhite}; border-radius: 8px;
  font-size: 13px; font-weight: 600; color: ${C.darkGrey};
}
.ee-table-row__name { font-weight: 500; font-size: 14px; flex: 1; }
.ee-table-row__count { font-size: 13px; color: ${C.darkGrey}; }
.ee-table-row__count--full { color: ${C.danger}; font-weight: 500; }

/* ---------- Venue dropzone ---------- */
.ee-dropzone {
  border: 2px dashed var(--ee-border-strong); border-radius: var(--ee-radius);
  padding: 48px 24px; text-align: center; cursor: pointer;
  background: ${C.offWhite}; color: ${C.darkGrey};
  transition: border-color 200ms ease, background 200ms ease, transform 200ms ease;
}
.ee-dropzone:hover { border-color: var(--ee-accent); background: ${C.white}; }
.ee-dropzone:active { transform: scale(0.995); }
.ee-dropzone--over {
  border-color: var(--ee-accent); background: color-mix(in srgb, var(--ee-accent) 5%, ${C.white});
}
.ee-dropzone__icon { color: ${C.midGrey}; margin-bottom: 12px; }
.ee-dropzone--over .ee-dropzone__icon { color: var(--ee-accent); }
.ee-dropzone__title { font-size: 15px; font-weight: 600; color: ${C.nearBlack}; margin: 0 0 4px; }
.ee-dropzone__hint { font-size: 13px; color: ${C.darkGrey}; margin: 0 0 8px; }
.ee-dropzone__formats { font-size: 12px; color: ${C.textMuted}; margin: 0; }

/* ---------- Venue preview ---------- */
.ee-venue-preview { }
.ee-venue-preview__img-wrap {
  border: 1px solid var(--ee-border); border-radius: var(--ee-radius);
  overflow: hidden; background: ${C.offWhite}; margin-bottom: 16px;
}
.ee-venue-preview__img { display: block; width: 100%; height: auto; max-height: 480px; object-fit: contain; }
.ee-venue-preview__actions { display: flex; gap: 8px; }

/* ---------- Invitation ---------- */
.ee-status-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px; border: 1px solid var(--ee-border); border-radius: var(--ee-radius-sm);
  margin-bottom: 20px;
}
.ee-status-row__label { font-size: 14px; font-weight: 500; margin: 0 0 4px; }
.ee-status-row__value { margin: 0; }
.ee-badge {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 500;
}
.ee-badge--on { background: color-mix(in srgb, var(--ee-accent) 12%, ${C.white}); color: var(--ee-accent); }
.ee-badge--off { background: ${C.lightGrey}; color: ${C.darkGrey}; }

.ee-link-list { display: flex; flex-direction: column; gap: 10px; }
.ee-link-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 16px; border: 1px solid var(--ee-border); border-radius: var(--ee-radius-sm);
  transition: border-color 200ms ease;
}
.ee-link-row:hover { border-color: var(--ee-border-strong); }
.ee-link-row__title { font-size: 14px; font-weight: 500; margin: 0 0 2px; }
.ee-link-row__url { font-size: 13px; color: ${C.textMuted}; margin: 0; font-family: 'SF Mono', 'Menlo', monospace; }
.ee-link-row__actions { display: flex; gap: 6px; flex-shrink: 0; }

/* ---------- Settings layout ---------- */
.ee-settings-grid {
  display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start;
}
.ee-settings-editor { display: flex; flex-direction: column; gap: 16px; }
.ee-settings-preview { position: sticky; top: 72px; }
.ee-preview-sticky { position: sticky; top: 72px; }
@media (max-width: 880px) {
  .ee-settings-grid { grid-template-columns: 1fr; }
  .ee-settings-preview { position: static; }
  .ee-preview-sticky { position: static; }
}

/* ---------- Presets ---------- */
.ee-presets {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}
@media (max-width: 600px) { .ee-presets { grid-template-columns: repeat(2, 1fr); } }
.ee-preset {
  appearance: none; border: 1px solid var(--ee-border); background: ${C.white};
  border-radius: var(--ee-radius-sm); padding: 12px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}
.ee-preset:hover { border-color: var(--ee-border-strong); box-shadow: var(--ee-shadow); transform: translateY(-1px); }
.ee-preset:active { transform: scale(0.98); }
.ee-preset__swatches { display: flex; gap: 4px; }
.ee-preset__swatch {
  width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.06);
}
.ee-preset__name { font-size: 12px; font-weight: 500; color: ${C.darkGrey}; }

/* ---------- Preview frame ---------- */
.ee-preview-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.ee-preview-toolbar__label { font-size: 13px; font-weight: 600; color: ${C.darkGrey}; }
.ee-preview-toggle {
  display: flex; background: ${C.lightGrey}; border-radius: 8px; padding: 2px;
}
.ee-preview-toggle__btn {
  appearance: none; border: none; background: transparent;
  padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  color: ${C.darkGrey}; cursor: pointer; transition: all 200ms ease;
}
.ee-preview-toggle__btn--active { background: ${C.white}; color: ${C.nearBlack}; box-shadow: var(--ee-shadow); }
.ee-preview-frame {
  border: 1px solid var(--ee-border); border-radius: var(--ee-radius);
  overflow: hidden; background: ${C.white}; box-shadow: var(--ee-shadow);
  transition: max-width 200ms ease;
  max-width: 100%;
}
.ee-preview-frame--mobile { max-width: 360px; margin: 0 auto; }

/* ---------- Theme preview ---------- */
.ee-theme-preview { box-shadow: none; }
.ee-theme-preview__logo { display: flex; justify-content: center; }
    `}</style>
  );
}
